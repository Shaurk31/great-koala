import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'routing_identities' })
export class RoutingIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  sendblueAccount: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  externalThreadId?: string;

  @Column('text', { array: true, default: () => "ARRAY[]::text[]" })
  allowedSenders: string[];

  @Column({ nullable: true })
  tenantIdentifier?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
