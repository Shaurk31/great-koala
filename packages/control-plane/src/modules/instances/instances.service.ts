import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { TenantInstance } from './tenant-instance.entity';

@Injectable()
export class InstancesService {
  constructor(
    @InjectRepository(TenantInstance)
    private readonly tenantInstances: Repository<TenantInstance>,
  ) {}

  async provision(tenant: Tenant) {
    const instance = this.tenantInstances.create({
      tenantId: tenant.id,
      hostname: `tenant-${tenant.id}.local`,
      internalUrl: `http://localhost:3001/runtime/${tenant.id}`,
      healthStatus: 'healthy',
      deployedImageVersion: 'mock-runtime-v1',
      stateVolumeId: `tenant-${tenant.id}-volume`,
    });
    return this.tenantInstances.save(instance);
  }

  async getByTenantId(tenantId: string) {
    return this.tenantInstances.findOne({ where: { tenantId } });
  }
}
