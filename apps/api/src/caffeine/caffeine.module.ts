import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { AuthModule } from '../auth/auth.module';
import { CaffeineService } from './caffeine.service';
import { CaffeineController } from './caffeine.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaffeineEntry]), AuthModule],
  controllers: [CaffeineController],
  providers: [CaffeineService],
  exports: [CaffeineService],
})
export class CaffeineModule {}
