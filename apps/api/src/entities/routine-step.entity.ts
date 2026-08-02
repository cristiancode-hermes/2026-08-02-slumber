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
import { Routine } from './routine.entity';
import { JSON_COL } from '../common/column-types';

@Entity('routine_steps')
export class RoutineStep {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column()
  routineId: string;

  @ManyToOne(() => Routine, (r) => r.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routineId' })
  routine: Routine;

  @Column({ length: 120 })
  title: string;

  @Column('int')
  durationMinutes: number;

  /** Per-routine ordering. */
  @Column('int')
  order: number;

  /** Array of YYYY-MM-DD dates this step was completed (set semantics). */
  @Column({ type: JSON_COL, default: () => "'[]'" })
  completedDates: string[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
