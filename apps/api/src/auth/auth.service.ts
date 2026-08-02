import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from '../entities/user.entity';
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  darkMode: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      id: randomUUID(),
      email,
      name: dto.name.trim(),
      passwordHash,
      timezone: 'Europe/Madrid',
      darkMode: true,
    } as any);
    const saved = (await this.users.save(user)) as unknown as User;
    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toAuthUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      const dup = await this.users.findOne({ where: { email } });
      if (dup && dup.id !== userId) {
        throw new ConflictException('Ya existe una cuenta con este email');
      }
      user.email = email;
    }
    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    if (dto.darkMode !== undefined) user.darkMode = dto.darkMode;
    await this.users.save(user);
    return this.toAuthUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(user);
    return { ok: true };
  }

  async validateUser(id: string): Promise<AuthUser | null> {
    const user = await this.users.findOne({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      darkMode: user.darkMode,
    };
  }

  private buildAuthResponse(user: User) {
    const authUser = this.toAuthUser(user);
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: authUser };
  }
}
