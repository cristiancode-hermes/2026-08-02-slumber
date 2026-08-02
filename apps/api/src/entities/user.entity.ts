import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SleepSession } from './sleep-session.entity';
import { SleepGoal } from './sleep-goal.entity';
import { Routine } from './routine.entity';
import { CaffeineEntry } from './caffeine-entry.entity';

@Entity('users')
export class User {
  @PrimaryColumn('text')
  id: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 64, default: 'Europe/Madrid' })
  timezone: string;

  @Column({ default: true })
  darkMode: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => SleepSession, (s) => s.user, { onDelete: 'CASCADE' })
  sessions: SleepSession[];

  @OneToMany(() => SleepGoal, (g) => g.user, { onDelete: 'CASCADE' })
  goals: SleepGoal[];

  @OneToMany(() => Routine, (r) => r.user, { onDelete: 'CASCADE' })
  routines: Routine[];

  @OneToMany(() => CaffeineEntry, (c) => c.user, { onDelete: 'CASCADE' })
  caffeineEntries: CaffeineEntry[];
}
