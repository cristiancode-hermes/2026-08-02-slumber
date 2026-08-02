import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto, CreateStepDto, ToggleStepDto, UpdateRoutineDto, UpdateStepDto } from './dto/routine.dto';

@ApiTags('routines')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  @Get('routines')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.routines.findAll(user.id);
  }

  @Post('routines')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoutineDto) {
    return this.routines.create(user.id, dto);
  }

  @Patch('routines/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateRoutineDto) {
    return this.routines.update(user.id, id, dto);
  }

  @Delete('routines/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.routines.remove(user.id, id);
  }

  @Post('routines/:id/steps')
  addStep(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateStepDto) {
    return this.routines.addStep(user.id, id, dto);
  }

  @Patch('routines/steps/:stepId')
  updateStep(@CurrentUser() user: AuthenticatedUser, @Param('stepId') stepId: string, @Body() dto: UpdateStepDto) {
    return this.routines.updateStep(user.id, stepId, dto);
  }

  @Post('routines/steps/:stepId/toggle')
  toggleStep(@CurrentUser() user: AuthenticatedUser, @Param('stepId') stepId: string, @Body() dto: ToggleStepDto) {
    return this.routines.toggleStep(user.id, stepId, dto);
  }

  @Delete('routines/steps/:stepId')
  @HttpCode(204)
  async removeStep(@CurrentUser() user: AuthenticatedUser, @Param('stepId') stepId: string) {
    await this.routines.removeStep(user.id, stepId);
  }
}
