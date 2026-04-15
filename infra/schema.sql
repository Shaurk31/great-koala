-- Core User Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subscription VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Runtime Management
CREATE TABLE tenant_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  hostname VARCHAR(255) NOT NULL,
  internal_url VARCHAR(255) NOT NULL,
  port INTEGER,
  health_status VARCHAR(50) DEFAULT 'provisioning',
  deployed_image_version VARCHAR(255),
  state_volume_id VARCHAR(255),
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_instances_tenant_id ON tenant_instances(tenant_id);
CREATE INDEX idx_tenant_instances_health_status ON tenant_instances(health_status);

-- Routing & Identity
CREATE TABLE routing_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sendblue_account VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  external_thread_id VARCHAR(255),
  allowed_senders TEXT[] DEFAULT '{}',
  tenant_identifier VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routing_identities_tenant_id ON routing_identities(tenant_id);
CREATE INDEX idx_routing_identities_sendblue_account ON routing_identities(sendblue_account);
CREATE INDEX idx_routing_identities_phone_number ON routing_identities(phone_number);

-- Third-Party Connections
CREATE TABLE third_party_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_type VARCHAR(50) NOT NULL,
  external_id VARCHAR(255),
  external_email VARCHAR(255),
  secret_ref_id UUID NOT NULL REFERENCES secret_refs(id),
  sync_status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_third_party_accounts_tenant_id ON third_party_accounts(tenant_id);
CREATE INDEX idx_third_party_accounts_account_type ON third_party_accounts(account_type);

-- Secrets Management
CREATE TABLE secret_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  secret_type VARCHAR(50) NOT NULL,
  aws_secret_id VARCHAR(255) NOT NULL,
  aws_region VARCHAR(50) DEFAULT 'us-east-1',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMP
);

CREATE INDEX idx_secret_refs_tenant_id ON secret_refs(tenant_id);
CREATE INDEX idx_secret_refs_aws_secret_id ON secret_refs(aws_secret_id);

-- Message Events
CREATE TABLE message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_message_id VARCHAR(255) NOT NULL,
  external_thread_id VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(20) NOT NULL,
  sender_name VARCHAR(255),
  text TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_events_tenant_id ON message_events(tenant_id);
CREATE INDEX idx_message_events_external_message_id ON message_events(external_message_id);
CREATE INDEX idx_message_events_external_thread_id ON message_events(external_thread_id);

-- Assistant Execution
CREATE TABLE assistant_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  message_event_id UUID NOT NULL REFERENCES message_events(id),
  session_id VARCHAR(255),
  intent VARCHAR(255),
  reasoning_content TEXT,
  status VARCHAR(50) DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_assistant_runs_tenant_id ON assistant_runs(tenant_id);
CREATE INDEX idx_assistant_runs_message_event_id ON assistant_runs(message_event_id);

-- Action Records (Audit Trail)
CREATE TABLE action_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assistant_run_id UUID REFERENCES assistant_runs(id),
  source_channel VARCHAR(50) NOT NULL,
  source_thread_id VARCHAR(255) NOT NULL,
  requested_by VARCHAR(20) NOT NULL,
  intent VARCHAR(255),
  operations JSONB,
  risk_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  confirmation_token_id UUID,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_action_records_tenant_id ON action_records(tenant_id);
CREATE INDEX idx_action_records_status ON action_records(status);
CREATE INDEX idx_action_records_risk_level ON action_records(risk_level);
CREATE INDEX idx_action_records_created_at ON action_records(created_at DESC);

-- Confirmations
CREATE TABLE confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_record_id UUID NOT NULL REFERENCES action_records(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  external_thread_id VARCHAR(255),
  sender_phone VARCHAR(20),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  responded_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_confirmation_tokens_tenant_id ON confirmation_tokens(tenant_id);
CREATE INDEX idx_confirmation_tokens_token ON confirmation_tokens(token);
CREATE INDEX idx_confirmation_tokens_expires_at ON confirmation_tokens(expires_at);

-- Tool Execution Log
CREATE TABLE tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_record_id UUID NOT NULL REFERENCES action_records(id),
  tool VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  params JSONB,
  result JSONB,
  error TEXT,
  status VARCHAR(50) NOT NULL,
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_tool_executions_tenant_id ON tool_executions(tenant_id);
CREATE INDEX idx_tool_executions_action_record_id ON tool_executions(action_record_id);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Usage & Billing
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_period VARCHAR(10) NOT NULL,
  message_count INTEGER DEFAULT 0,
  action_count INTEGER DEFAULT 0,
  model_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_records_tenant_id ON usage_records(tenant_id);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  intent VARCHAR(255),
  tool VARCHAR(50),
  action VARCHAR(50),
  risk_level VARCHAR(50) NOT NULL,
  requires_confirmation BOOLEAN DEFAULT false,
  requires_dashboard_approval BOOLEAN DEFAULT false,
  auto_execute BOOLEAN DEFAULT false,
  conditions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_rules_tenant_id ON policy_rules(tenant_id);
CREATE INDEX idx_policy_rules_risk_level ON policy_rules(risk_level);
