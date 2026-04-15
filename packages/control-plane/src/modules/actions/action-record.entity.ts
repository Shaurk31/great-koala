import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'action_records' })
export class ActionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  assistantRunId?: string;

  @Column()
  sourceChannel: string;

  @Column()
  sourceThreadId: string;

  @Column()
  requestedBy: string;

  @Column({ nullable: true })
  intent?: string;

  @Column('jsonb')
  operations: unknown[];

  @Column()
  riskLevel: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  confirmationTokenId?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  executedAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  completedAt?: Date;
}
