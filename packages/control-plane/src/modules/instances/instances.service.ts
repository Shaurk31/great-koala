import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { TenantInstance } from './tenant-instance.entity';
import { Provisioner } from './provisioner';

@Injectable()
export class InstancesService {
  constructor(
    @InjectRepository(TenantInstance)
    private readonly tenantInstances: Repository<TenantInstance>,
    private readonly provisioner: Provisioner,
  ) {}

  async provision(tenant: Tenant) {
    const runtime = await this.provisioner.provisionTenantRuntime(tenant);
    const hostname = await this.provisioner.registerSubdomain(tenant, runtime.hostname);

    const existing = await this.getByTenantId(tenant.id);
    const instance = existing || this.tenantInstances.create({ tenantId: tenant.id });

    instance.hostname = hostname;
    instance.internalUrl = runtime.internalUrl;
    instance.healthStatus = runtime.healthStatus;
    instance.deployedImageVersion = runtime.deployedImageVersion;
    instance.stateVolumeId = runtime.stateVolumeId;
    instance.lastHeartbeat = runtime.lastHeartbeat;

    return this.tenantInstances.save(instance);
  }

  async getByTenantId(tenantId: string) {
    return this.tenantInstances.findOne({ where: { tenantId } });
  }

  async syncHealth(tenantId: string) {
    const instance = await this.getByTenantId(tenantId);
    if (!instance) {
      return null;
    }

    const result = await this.provisioner.checkHealth(instance.internalUrl);
    instance.healthStatus = result.healthy ? 'healthy' : 'unhealthy';
    instance.lastHeartbeat = result.checkedAt;
    return this.tenantInstances.save(instance);
  }
}
