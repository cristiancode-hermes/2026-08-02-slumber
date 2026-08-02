import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { RoutineStep } from './routine-step.entity';

export type RoutineType = 'evening' | 'morning';

@Entity('routines')
export class Routine {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.routines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 80 })
  name: string;

  @Column({ length: 16, default: 'evening' })
  type: RoutineType;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => RoutineStep, (s) => s.routine, { cascade: true, onDelete: 'CASCADE' })
  steps: RoutineStep[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
