import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SleepSession } from '../entities/sleep-session.entity';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { AuthModule } from '../auth/auth.module';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SleepSession, CaffeineEntry]), AuthModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
