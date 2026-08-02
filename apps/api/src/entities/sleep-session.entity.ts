import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FactorValue } from '../common/factor.enum';
import { DATE_COL, DATE_TIME, JSON_COL } from '../common/column-types';

@Entity('sleep_sessions')
@Index(['userId', 'date'])
export class SleepSession {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Session day (YYYY-MM-DD) in the user's timezone. */
  @Column({ type: DATE_COL })
  date: string;

  /** Bedtime instant (ISO UTC). */
  @Column({ type: DATE_TIME })
  bedtime: string;

  /** Wake instant (ISO UTC). CHECK wakeTime > bedtime enforced in service. */
  @Column({ type: DATE_TIME })
  wakeTime: string;

  /** Computed by backend, cross-midnight safe. */
  @Column('int')
  durationMinutes: number;

  /** 1–5, nullable (optional). */
  @Column({ type: 'int', nullable: true })
  qualityScore: number | null;

  /** 1–5, nullable (optional). */
  @Column({ type: 'int', nullable: true })
  feeling: number | null;

  /** Factor enum array (≤6), JSONB on PG / simple-json on SQLite. */
  @Column({ type: JSON_COL, default: () => "'[]'" })
  factors: FactorValue[];

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Computed vs active goal (duration >= targetHours*60). */
  @Column({ default: false })
  sleepGoalMet: boolean;

  @CreateDateColumn({ type: DATE_TIME })
  createdAt: Date;

  @UpdateDateColumn({ type: DATE_TIME })
  updatedAt: Date;
}
