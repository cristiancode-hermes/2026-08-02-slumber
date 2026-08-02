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
import { TIME_COL } from '../common/column-types';

@Entity('sleep_goals')
export class SleepGoal {
  @PrimaryColumn('text')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Target hours per night, e.g. 7.5. CHECK 4–12 in DTO. */
  @Column('real')
  targetHours: number;

  /** Target bedtime HH:MM. */
  @Column({ type: TIME_COL })
  targetBedtime: string;

  /** Target wake time HH:MM. */
  @Column({ type: TIME_COL })
  targetWakeTime: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
