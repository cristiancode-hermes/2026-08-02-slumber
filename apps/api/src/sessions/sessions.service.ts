import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SleepSession } from '../entities/sleep-session.entity';
import { SleepGoal } from '../entities/sleep-goal.entity';
import { CreateSessionDto, SessionQueryDto, UpdateSessionDto } from './dto/session.dto';
import { computeSleepGoalMet, validateSession } from './session-math';
import { todayInTz } from '../common/dates';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SleepSession) private readonly sessions: Repository<SleepSession>,
    @InjectRepository(SleepGoal) private readonly goals: Repository<SleepGoal>,
  ) {}

  async findAll(userId: string, query: SessionQueryDto) {
    const qb = this.sessions.createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.date', 'DESC')
      .addOrderBy('s.bedtime', 'DESC');

    if (query.from) qb.andWhere('s.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('s.date <= :to', { to: query.to });
    if (query.qualityMin) qb.andWhere('s.qualityScore >= :qualityMin', { qualityMin: query.qualityMin });
    if (query.goalMet !== undefined) {
      qb.andWhere('s.sleepGoalMet = :goalMet', { goalMet: query.goalMet === 'true' });
    }
    if (query.factor) {
      // Portable JSON containment: PG jsonb @> vs SQLite LIKE on serialized text.
      if (process.env.DATABASE_TYPE === 'postgres') {
        qb.andWhere(`s.factors @> :factor::jsonb`, { factor: JSON.stringify([query.factor]) });
      } else {
        qb.andWhere(`s.factors LIKE :factor`, { factor: `%"${query.factor}"%` });
      }
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(userId: string, id: string): Promise<SleepSession> {
    const session = await this.sessions.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    return session;
  }

  async create(userId: string, dto: CreateSessionDto): Promise<SleepSession> {
    const goal = await this.goals.findOne({ where: { userId } });
    const result = validateSession(dto.bedtime, dto.wakeTime);
    if (!result.ok) throw new BadRequestException(result.message);

    const session = this.sessions.create({
      id: randomUUID(),
      userId,
      date: dto.date,
      bedtime: new Date(dto.bedtime).toISOString(),
      wakeTime: new Date(dto.wakeTime).toISOString(),
      durationMinutes: result.durationMinutes,
      qualityScore: dto.qualityScore ?? null,
      feeling: dto.feeling ?? null,
      factors: dto.factors ?? [],
      notes: dto.notes ?? null,
      sleepGoalMet: goal ? computeSleepGoalMet(result.durationMinutes, goal.targetHours) : false,
    } as any);
    return this.sessions.save(session) as unknown as SleepSession;
  }

  async update(userId: string, id: string, dto: UpdateSessionDto): Promise<SleepSession> {
    const session = await this.findOne(userId, id);
    const goal = await this.goals.findOne({ where: { userId } });

    const nextBedtime = dto.bedtime ? new Date(dto.bedtime).toISOString() : session.bedtime;
    const nextWakeTime = dto.wakeTime ? new Date(dto.wakeTime).toISOString() : session.wakeTime;
    const result = validateSession(nextBedtime, nextWakeTime);
    if (!result.ok) throw new BadRequestException(result.message);

    if (dto.date !== undefined) session.date = dto.date;
    if (dto.bedtime !== undefined) session.bedtime = nextBedtime;
    if (dto.wakeTime !== undefined) session.wakeTime = nextWakeTime;
    session.durationMinutes = result.durationMinutes;
    if (dto.qualityScore !== undefined) session.qualityScore = dto.qualityScore;
    if (dto.feeling !== undefined) session.feeling = dto.feeling;
    if (dto.factors !== undefined) session.factors = dto.factors;
    if (dto.notes !== undefined) session.notes = dto.notes;
    session.sleepGoalMet = goal ? computeSleepGoalMet(result.durationMinutes, goal.targetHours) : false;

    return this.sessions.save(session) as unknown as SleepSession;
  }

  async remove(userId: string, id: string): Promise<void> {
    const session = await this.findOne(userId, id);
    await this.sessions.remove(session);
  }

  /** CSV export: BOM UTF-8, `;` separator (Excel ES compatible). */
  async exportCsv(userId: string): Promise<string> {
    const items = await this.sessions.find({
      where: { userId },
      order: { date: 'DESC' },
    });
    const header = ['fecha', 'acostarse', 'despertar', 'duracion_min', 'calidad', 'sensacion', 'factores', 'notas', 'meta_cumplida'];
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = items.map((s) =>
      [
        s.date,
        new Date(s.bedtime).toISOString(),
        new Date(s.wakeTime).toISOString(),
        s.durationMinutes,
        s.qualityScore ?? '',
        s.feeling ?? '',
        (s.factors ?? []).join('|'),
        s.notes ?? '',
        s.sleepGoalMet ? 'si' : 'no',
      ]
        .map(esc)
        .join(';'),
    );
    return '\uFEFF' + [header.join(';'), ...rows].join('\n');
  }

  /** Sessions for dashboard week chart (last 7 days ending today in user tz). */
  async weekSeries(userId: string, timezone: string) {
    const today = todayInTz(timezone);
    const qb = this.sessions.createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.date <= :today', { today });
    const sessions = await qb.orderBy('s.date', 'DESC').take(14).getMany();
    return sessions;
  }
}
