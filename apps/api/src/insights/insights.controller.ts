import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get('weekly')
  weekly(
    @CurrentUser() user: AuthenticatedUser,
    @Query('weeks', new DefaultValuePipe(4), new ParseIntPipe()) weeks = 4,
  ) {
    return this.insights.weekly(user.id, user.timezone ?? 'Europe/Madrid', Math.min(Math.max(weeks, 1), 12));
  }

  @Get('factors')
  factors(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(30), new ParseIntPipe()) limit = 30,
  ) {
    return this.insights.factors(user.id, Math.min(Math.max(limit, 1), 200));
  }

  @Get('caffeine')
  caffeine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(30), new ParseIntPipe()) limit = 30,
  ) {
    return this.insights.caffeineImpact(user.id, Math.min(Math.max(limit, 1), 200));
  }
}
