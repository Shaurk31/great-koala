import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { createClient } from 'redis';
import crypto from 'crypto';
import logger from './lib/logger';
import { ControlPlaneClient } from './clients/control-plane.client';
import { SendblueClient } from './clients/sendblue.client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3001';
const SENDBLUE_API_URL = process.env.SENDBLUE_API_URL || 'https://api.sendblue.io/v1';
const SENDBLUE_API_KEY = process.env.SENDBLUE_API_KEY || '';
const WEBHOOK_SECRET = process.env.SENDBLUE_WEBHOOK_SECRET || '';
const DEDUPE_WINDOW_SEC = 300;
const TENANT_RATE_LIMIT_PER_MINUTE = Number(process.env.TENANT_RATE_LIMIT_PER_MINUTE || 60);

const redisClient = createClient({ url: REDIS_URL });
const controlPlane = new ControlPlaneClient(CONTROL_PLANE_URL);
const sendblueClient = new SendblueClient(SENDBLUE_API_URL, SENDBLUE_API_KEY);

app.use(express.json());

const verifySendblueSignature = (req: Request) => {
  if (!WEBHOOK_SECRET) return true;
  const signature = req.header('x-sendblue-signature');
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  return signature === expected;
};

const normalizeText = (text: string) => text.trim().toLowerCase();

const parseConfirmationIntent = (text: string): boolean | null => {
  const normalized = normalizeText(text);
  if (['yes', 'y', 'confirm', 'okay', 'ok', 'sure'].includes(normalized)) return true;
  if (['no', 'n', 'cancel', 'stop'].includes(normalized)) return false;
  return null;
};

const parseSendblueEvent = (payload: any) => {
  return {
    messageId: payload.message_id || payload.id || payload.eventId || '',
    threadId: payload.thread_id || payload.conversation_id || payload.external_thread_id || '',
    from: payload.from || payload.sender || payload.customer_phone || '',
    to: payload.to || payload.recipient || payload.account_phone || '',
    text: payload.text || payload.body || payload.message || '',
    sendblueAccount: payload.account || payload.sendblueAccount || payload.account_id || '',
  };
};

const getMinuteBucket = () => Math.floor(Date.now() / 60000);

const enforceTenantRateLimit = async (tenantId: string) => {
  const key = `tenant:rate:${tenantId}:${getMinuteBucket()}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 120);
  }
  return {
    allowed: count <= TENANT_RATE_LIMIT_PER_MINUTE,
    count,
    limit: TENANT_RATE_LIMIT_PER_MINUTE,
  };
};

const trackOutboundStatus = async (messageId: string, status: unknown) => {
  const statusKey = `sendblue:status:${messageId}`;
  await redisClient.setEx(statusKey, 60 * 60 * 24, JSON.stringify(status));
};

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/webhooks/sendblue', async (req: Request, res: Response) => {
  try {
    if (!verifySendblueSignature(req)) {
      logger.warn('Invalid Sendblue webhook signature', { headers: req.headers });
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const event = parseSendblueEvent(req.body);
    logger.info('Received Sendblue webhook', { event });

    if (!event.messageId || !event.from || !event.sendblueAccount) {
      return res.status(400).json({ success: false, error: 'Missing required webhook fields' });
    }

    const dedupeKey = `sendblue:event:${event.messageId}`;
    const wasProcessed = await redisClient.get(dedupeKey);
    if (wasProcessed) {
      logger.info('Duplicate Sendblue webhook ignored', { messageId: event.messageId });
      return res.json({ success: true, duplicate: true });
    }
    await redisClient.setEx(dedupeKey, DEDUPE_WINDOW_SEC, '1');

    const routing = await controlPlane.resolveRouting(event.sendblueAccount, event.from, event.threadId);
    const rateLimit = await enforceTenantRateLimit(routing.tenantId);
    if (!rateLimit.allowed) {
      logger.warn('Tenant rate limit exceeded', {
        tenantId: routing.tenantId,
        currentCount: rateLimit.count,
        limit: rateLimit.limit,
      });
      return res.status(429).json({
        success: false,
        error: 'Tenant message rate limit exceeded',
        data: { tenantId: routing.tenantId, limit: rateLimit.limit },
      });
    }

    const confirmationIntent = parseConfirmationIntent(event.text);

    if (confirmationIntent !== null) {
      const confirmationResult = await controlPlane.confirmResponse(
        routing.tenantId,
        event.from,
        event.threadId || event.messageId,
        confirmationIntent,
      );

      const confirmationSucceeded = Boolean(confirmationResult?.success);
      const message = confirmationSucceeded
        ? (confirmationIntent ? 'Your request has been confirmed.' : 'Your request has been cancelled.')
        : 'No pending confirmation was found for this thread. Please submit the request again.';

      const sendResult = await sendblueClient.sendMessage({
        to: event.from,
        text: message,
        externalThreadId: event.threadId || event.messageId,
      });
      await trackOutboundStatus(event.messageId, sendResult);

      if (!sendResult.success) {
        return res.status(502).json({ success: false, error: 'Failed to send confirmation status to Sendblue' });
      }

      return res.json({ success: true, confirmationResult });
    }

    const runtimeResult = await controlPlane.forwardMessage(routing.tenantId, {
      text: event.text,
      externalThreadId: event.threadId || event.messageId,
      sender: { phone: event.from },
    });

    if (runtimeResult?.type === 'confirm') {
      const responseText = `⚠️ Action requires confirmation:\n${runtimeResult.text}\nReply YES to confirm or NO to cancel.`;
      const sendResult = await sendblueClient.sendMessage({
        to: event.from,
        text: responseText,
        externalThreadId: event.threadId || event.messageId,
      });
      await trackOutboundStatus(event.messageId, sendResult);

      if (!sendResult.success) {
        return res.status(502).json({ success: false, error: 'Failed to send confirmation prompt to Sendblue' });
      }

      return res.json({ success: true, pendingConfirmation: true, actionId: runtimeResult.actionId });
    }

    if (runtimeResult?.type === 'reply') {
      const sendResult = await sendblueClient.sendMessage({
        to: event.from,
        text: runtimeResult.text,
        externalThreadId: event.threadId || event.messageId,
      });
      await trackOutboundStatus(event.messageId, sendResult);

      if (!sendResult.success) {
        return res.status(502).json({ success: false, error: 'Failed to send reply through Sendblue' });
      }

      return res.json({ success: true, replySent: true });
    }

    return res.json({ success: true, data: runtimeResult });
  } catch (error) {
    logger.error('Webhook processing error', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/confirmations/:confirmationToken', async (req: Request, res: Response) => {
  try {
    const { confirmationToken } = req.params;
    const { confirm } = req.body;
    const result = await controlPlane.confirmWithToken(confirmationToken, confirm);
    return res.json(result);
  } catch (error) {
    logger.error('Confirmation endpoint error', { error: error instanceof Error ? error.message : error });
    return res.status(500).json({ success: false, error: String(error) });
  }
});

app.use((err: any, _req: Request, res: Response, _next: Function) => {
  logger.error('Unhandled error', { error: err });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const startBridge = async () => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    app.listen(PORT, () => {
      logger.info(`Bridge service running on port ${PORT}`);
      console.log(`🌉 Bridge running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Bridge startup failed', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
};

startBridge();
