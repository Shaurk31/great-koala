import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tool_executions' })
export class ToolExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  actionRecordId: string;

  @Column()
  tool: string;

  @Column()
  action: string;

  @Column('jsonb')
  params: unknown;

  @Column('jsonb', { nullable: true })
  result?: unknown;

  @Column({ nullable: true })
  error?: string;

  @Column()
  status: string;

  @Column({ nullable: true, type: 'timestamptz' })
  executedAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  completedAt?: Date;
}
