import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { CaffeineQueryDto, CreateCaffeineDto } from './dto/caffeine.dto';
import { todayInTz } from '../common/dates';

@Injectable()
export class CaffeineService {
  constructor(
    @InjectRepository(CaffeineEntry) private readonly entries: Repository<CaffeineEntry>,
  ) {}

  async findAll(userId: string, query: CaffeineQueryDto): Promise<CaffeineEntry[]> {
    const qb = this.entries
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .orderBy('c.consumedAt', 'DESC');
    if (query.from) qb.andWhere('c.consumedAt >= :from', { from: new Date(query.from).toISOString() });
    if (query.to) qb.andWhere('c.consumedAt <= :to', { to: new Date(query.to).toISOString() });
    return qb.take(200).getMany();
  }

  async create(userId: string, dto: CreateCaffeineDto): Promise<CaffeineEntry> {
    const entry = this.entries.create({
      id: randomUUID(),
      userId,
      consumedAt: new Date(dto.consumedAt).toISOString(),
      amountMg: dto.amountMg,
      label: dto.label ?? null,
    } as any);
    return this.entries.save(entry) as unknown as CaffeineEntry;
  }

  async remove(userId: string, id: string): Promise<void> {
    const entry = await this.entries.findOne({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.entries.remove(entry);
  }

  /** Today's entries + total mg (in user tz). */
  async todaySummary(userId: string, timezone: string) {
    const all = await this.entries.find({ where: { userId } });
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const today = todayInTz(timezone);
    const list = all
      .filter((e) => fmt.format(new Date(e.consumedAt)) === today)
      .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
    const totalMg = list.reduce((acc, e) => acc + e.amountMg, 0);
    return { items: list, totalMg };
  }
}
