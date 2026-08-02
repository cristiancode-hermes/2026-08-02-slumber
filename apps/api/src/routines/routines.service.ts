import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Routine } from '../entities/routine.entity';
import { RoutineStep } from '../entities/routine-step.entity';
import { CreateRoutineDto, CreateStepDto, ToggleStepDto, UpdateRoutineDto, UpdateStepDto } from './dto/routine.dto';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine) private readonly routines: Repository<Routine>,
    @InjectRepository(RoutineStep) private readonly steps: Repository<RoutineStep>,
  ) {}

  async findAll(userId: string): Promise<Routine[]> {
    const list = await this.routines.find({
      where: { userId },
      relations: { steps: true },
      order: { position: 'ASC' },
    });
    for (const r of list) {
      r.steps = r.steps.sort((a, b) => a.order - b.order);
    }
    return list;
  }

  private async getOwned(userId: string, id: string): Promise<Routine> {
    const routine = await this.routines.findOne({ where: { id, userId } });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    return routine;
  }

  private async getStepOwned(userId: string, stepId: string): Promise<RoutineStep> {
    const step = await this.steps
      .createQueryBuilder('s')
      .innerJoin('s.routine', 'r')
      .where('s.id = :stepId', { stepId })
      .andWhere('r.userId = :userId', { userId })
      .getOne();
    if (!step) throw new NotFoundException('Paso no encontrado');
    return step;
  }

  async create(userId: string, dto: CreateRoutineDto): Promise<Routine> {
    const maxPos = await this.routines
      .createQueryBuilder('r')
      .select('COALESCE(MAX(r.position), 0)', 'max')
      .where('r.userId = :userId', { userId })
      .getRawOne();
    const routine = this.routines.create({
      id: randomUUID(),
      userId,
      name: dto.name,
      type: dto.type,
      position: (maxPos?.max ?? 0) + 1,
      steps: [],
    } as any);
    return this.routines.save(routine) as unknown as Routine;
  }

  async update(userId: string, id: string, dto: UpdateRoutineDto): Promise<Routine> {
    const routine = await this.getOwned(userId, id);
    if (dto.name !== undefined) routine.name = dto.name;
    if (dto.type !== undefined) routine.type = dto.type;
    return this.routines.save(routine);
  }

  async remove(userId: string, id: string): Promise<void> {
    const routine = await this.getOwned(userId, id);
    await this.routines.remove(routine);
  }

  async addStep(userId: string, routineId: string, dto: CreateStepDto): Promise<RoutineStep> {
    await this.getOwned(userId, routineId);
    const maxOrder = await this.steps
      .createQueryBuilder('s')
      .select('COALESCE(MAX(s.order), 0)', 'max')
      .where('s.routineId = :routineId', { routineId })
      .getRawOne();
    const step = this.steps.create({
      id: randomUUID(),
      routineId,
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      order: (maxOrder?.max ?? 0) + 1,
      completedDates: [],
    } as any);
    return this.steps.save(step) as unknown as RoutineStep;
  }

  async updateStep(userId: string, stepId: string, dto: UpdateStepDto): Promise<RoutineStep> {
    const step = await this.getStepOwned(userId, stepId);
    if (dto.title !== undefined) step.title = dto.title;
    if (dto.durationMinutes !== undefined) step.durationMinutes = dto.durationMinutes;
    if (dto.order !== undefined) step.order = dto.order;
    return this.steps.save(step) as unknown as RoutineStep;
  }

  /** Toggle completedDates for a date — set semantics. */
  async toggleStep(userId: string, stepId: string, dto: ToggleStepDto): Promise<RoutineStep> {
    const step = await this.getStepOwned(userId, stepId);
    const dates = Array.isArray(step.completedDates) ? [...step.completedDates] : [];
    const idx = dates.indexOf(dto.date);
    if (idx >= 0) dates.splice(idx, 1);
    else dates.push(dto.date);
    step.completedDates = dates;
    return this.steps.save(step);
  }

  async removeStep(userId: string, stepId: string): Promise<void> {
    const step = await this.getStepOwned(userId, stepId);
    await this.steps.remove(step);
  }
}
