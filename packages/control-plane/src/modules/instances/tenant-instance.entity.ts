import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tenant_instances' })
export class TenantInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  hostname: string;

  @Column()
  internalUrl: string;

  @Column({ nullable: true })
  port?: number;

  @Column({ default: 'provisioning' })
  healthStatus: string;

  @Column({ nullable: true })
  deployedImageVersion?: string;

  @Column({ nullable: true })
  stateVolumeId?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastHeartbeat?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
