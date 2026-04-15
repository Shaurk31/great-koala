import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingIdentity } from './routing-identity.entity';

@Injectable()
export class RoutingService {
  constructor(
    @InjectRepository(RoutingIdentity)
    private readonly routing: Repository<RoutingIdentity>,
  ) {}

  async create(mapping: Partial<RoutingIdentity>) {
    const identity = this.routing.create(mapping);
    return this.routing.save(identity);
  }

  async resolve(sendblueAccount: string, phoneNumber: string, externalThreadId?: string) {
    let identity: RoutingIdentity | null = null;

    if (externalThreadId) {
      identity = await this.routing.findOne({
        where: {
          sendblueAccount,
          phoneNumber,
          externalThreadId,
          isActive: true,
        },
      });
    }

    if (!identity) {
      identity = await this.routing.findOne({
        where: {
          sendblueAccount,
          phoneNumber,
          isActive: true,
        },
      });
    }

    if (!identity) {
      throw new NotFoundException('Routing identity not found');
    }
    return identity;
  }

  async getById(id: string) {
    const identity = await this.routing.findOne({ where: { id } });
    if (!identity) {
      throw new NotFoundException('Routing identity not found');
    }
    return identity;
  }
}
