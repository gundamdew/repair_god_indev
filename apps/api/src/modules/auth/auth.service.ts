import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

export interface UserRecord {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  lang: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpCache = new Map<string, { code: string; expiresAt: number }>();
  // In-memory fallback users cache if database is temporarily offline
  private readonly mockUsers = new Map<string, UserRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Seed default mock user for dev
    const defaultUser: UserRecord = {
      id: 'usr-default-demo-1',
      phone: '+48500100200',
      email: 'michal.kowalski@example.pl',
      name: 'Michał Kowalski',
      role: UserRole.CUSTOMER,
      lang: 'pl',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mockUsers.set(defaultUser.phone, defaultUser);
    this.mockUsers.set(defaultUser.id, defaultUser);
  }

  async requestOtp(phone: string): Promise<{ message: string; devCode?: string }> {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const code = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min TTL

    this.otpCache.set(phone, { code, expiresAt });
    this.logger.log(`Generated OTP for ${phone}: ${code}`);

    return {
      message: 'Kod SMS został pomyślnie wysłany.',
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; user: UserRecord }> {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const cached = this.otpCache.get(phone);

    const isValidCode =
      (isDev && code === '123456') ||
      (cached && cached.code === code && cached.expiresAt > Date.now());

    if (!isValidCode) {
      throw new UnauthorizedException('Niepoprawny lub przedawniony kod weryfikacyjny OTP.');
    }

    this.otpCache.delete(phone);

    let user: UserRecord;

    if (this.prisma.isConnected) {
      try {
        let dbUser = await this.prisma.user.findUnique({ where: { phone } });
        if (!dbUser) {
          dbUser = await this.prisma.user.create({
            data: {
              phone,
              name: 'Nowy Użytkownik',
              role: UserRole.CUSTOMER,
              lang: 'pl',
            },
          });
        }
        user = dbUser;
      } catch (err) {
        this.logger.warn(`Failed DB query for user ${phone}, falling back to memory: ${err}`);
        user = this.getOrCreateMemoryUser(phone);
      }
    } else {
      user = this.getOrCreateMemoryUser(phone);
    }

    const payload = {
      sub: user.id,
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user,
    };
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.findUnique({ where: { id } });
      } catch {
        return this.mockUsers.get(id) || null;
      }
    }
    return this.mockUsers.get(id) || null;
  }

  private getOrCreateMemoryUser(phone: string): UserRecord {
    let user = this.mockUsers.get(phone);
    if (!user) {
      user = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        phone,
        email: null,
        name: 'Michał Kowalski',
        role: UserRole.CUSTOMER,
        lang: 'pl',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.mockUsers.set(phone, user);
      this.mockUsers.set(user.id, user);
    }
    return user;
  }
}
