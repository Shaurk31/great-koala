import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'third_party_accounts' })
export class ThirdPartyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  accountType: string;

  @Column({ nullable: true })
  externalId?: string;

  @Column({ nullable: true })
  externalEmail?: string;

  @Column({ nullable: true })
  secretRefId?: string;

  @Column({ default: 'active' })
  syncStatus: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastSyncAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
