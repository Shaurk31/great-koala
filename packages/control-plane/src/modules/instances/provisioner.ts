import { Injectable } from '@nestjs/common';
import { Tenant } from '../tenants/tenant.entity';

export type ProvisionedTenantRuntime = {
  hostname: string;
  internalUrl: string;
  deployedImageVersion: string;
  stateVolumeId: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: Date;
};

@Injectable()
export class Provisioner {
  async provisionTenantRuntime(tenant: Tenant): Promise<ProvisionedTenantRuntime> {
    const runtimeHost = `tenant-${tenant.id}.local`;

    return {
      hostname: runtimeHost,
      internalUrl: process.env.OPENCLAW_BASE_URL
        ? `${process.env.OPENCLAW_BASE_URL.replace(/\/$/, '')}/${tenant.id}`
        : `http://localhost:3001/runtime/${tenant.id}`,
      deployedImageVersion: process.env.OPENCLAW_IMAGE_VERSION || 'openclaw-dev-latest',
      stateVolumeId: `tenant-${tenant.id}-volume`,
      healthStatus: 'healthy',
      lastHeartbeat: new Date(),
    };
  }

  async registerSubdomain(tenant: Tenant, fallbackHostname: string): Promise<string> {
    const zone = process.env.TENANT_DOMAIN_ZONE;
    if (!zone) {
      return fallbackHostname;
    }
    return `${tenant.id}.${zone}`;
  }

  async checkHealth(internalUrl: string): Promise<{ healthy: boolean; checkedAt: Date }> {
    const checkedAt = new Date();
    try {
      const response = await fetch(`${internalUrl.replace(/\/$/, '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return { healthy: response.ok, checkedAt };
    } catch {
      return { healthy: false, checkedAt };
    }
  }
}
