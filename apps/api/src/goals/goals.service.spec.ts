import { GoalsService } from './goals.service';
import { SleepGoal } from '../entities/sleep-goal.entity';

describe('GoalsService (pure upsert logic + goal math)', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((g: SleepGoal) => g),
    save: jest.fn((g: SleepGoal) => Promise.resolve(g)),
  };
  const service = new GoalsService(repo as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a goal when none exists', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    const saved = await service.upsert('usr-1', {
      targetHours: 8,
      targetBedtime: '22:30',
      targetWakeTime: '06:30',
    });
    expect(saved).toMatchObject({ userId: 'usr-1', targetHours: 8 });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('updates the existing goal instead of creating a second one', async () => {
    const existing = {
      id: 'goal-1',
      userId: 'usr-1',
      targetHours: 7,
      targetBedtime: '23:00',
      targetWakeTime: '07:00',
    } as SleepGoal;
    (repo.findOne as jest.Mock).mockResolvedValue(existing);
    const saved = await service.upsert('usr-1', {
      targetHours: 8.5,
      targetBedtime: '22:00',
      targetWakeTime: '06:30',
    });
    expect(saved).toMatchObject({ id: 'goal-1', targetHours: 8.5, targetBedtime: '22:00' });
  });

  it('returns null when no goal exists for the user', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    expect(await service.getActive('usr-2')).toBeNull();
  });

  it('assigns a fresh id and user-scoped record on create', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    const saved = await service.upsert('usr-9', {
      targetHours: 6,
      targetBedtime: '00:00',
      targetWakeTime: '06:00',
    });
    expect(saved).toMatchObject({ userId: 'usr-9', targetHours: 6 });
    expect(typeof (saved as SleepGoal).id).toBe('string');
    expect((saved as SleepGoal).id.length).toBeGreaterThan(0);
  });
});
