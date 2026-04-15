import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { InstancesService } from '../instances/instances.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly instancesService: InstancesService,
  ) {}

  async create(userId: string, name: string, phone?: string) {
    const tenant = this.tenants.create({ userId, name, phone });
    const saved = await this.tenants.save(tenant);
    await this.instancesService.provision(saved);
    return saved;
  }

  async listForUser(userId: string) {
    return this.tenants.find({ where: { userId } });
  }

  async getById(tenantId: string) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }
}
