import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'policy_rules' })
export class PolicyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  intent?: string;

  @Column()
  tool: string;

  @Column()
  action: string;

  @Column({ default: 'low' })
  riskLevel: string;

  @Column({ default: false })
  requiresConfirmation: boolean;

  @Column({ default: false })
  requiresDashboardApproval: boolean;

  @Column({ default: false })
  autoExecute: boolean;

  @Column('jsonb', { nullable: true })
  conditions?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
