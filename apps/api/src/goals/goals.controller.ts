import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { GoalsService } from './goals.service';
import { UpsertGoalDto } from './dto/goal.dto';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  getActive(@CurrentUser() user: AuthenticatedUser) {
    return this.goals.getActive(user.id);
  }

  @Put()
  upsert(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertGoalDto) {
    return this.goals.upsert(user.id, dto);
  }
}
