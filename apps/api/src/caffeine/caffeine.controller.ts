import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CaffeineService } from './caffeine.service';
import { CaffeineQueryDto, CreateCaffeineDto } from './dto/caffeine.dto';

@ApiTags('caffeine')
@Controller('caffeine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CaffeineController {
  constructor(private readonly caffeine: CaffeineService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CaffeineQueryDto) {
    return this.caffeine.findAll(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCaffeineDto) {
    return this.caffeine.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.caffeine.remove(user.id, id);
  }
}
