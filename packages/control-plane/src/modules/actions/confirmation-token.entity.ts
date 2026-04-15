import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ActionRecord } from './action-record.entity';

@Entity({ name: 'confirmation_tokens' })
export class ConfirmationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  actionRecordId: string;

  @ManyToOne(() => ActionRecord)
  @JoinColumn({ name: 'actionRecordId' })
  actionRecord: ActionRecord;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  externalThreadId?: string;

  @Column()
  senderPhone: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true, type: 'timestamptz' })
  respondedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
