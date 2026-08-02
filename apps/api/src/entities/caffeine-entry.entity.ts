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
import { DATE_TIME } from '../common/column-types';

@Entity('caffeine_entries')
export class CaffeineEntry {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.caffeineEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** When the caffeine was consumed (ISO UTC). */
  @Column({ type: DATE_TIME })
  consumedAt: string;

  /** Milligrams, 1–1000. */
  @Column('int')
  amountMg: number;

  /** Optional label: café, té, cola… */
  @Column({ type: 'varchar', length: 40, nullable: true })
  label: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
