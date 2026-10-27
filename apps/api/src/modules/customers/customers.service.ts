import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            devices: true,
            _count: {
              select: { orders: true, devices: true },
            },
          },
        });
        if (user) return user;
      } catch {
        // Fallback below
      }
    }

    return {
      id: userId,
      phone: '+48500100200',
      email: 'michal.kowalski@example.pl',
      name: 'Michał Kowalski',
      role: 'CUSTOMER',
      lang: 'pl',
      devices: [],
      _count: { orders: 0, devices: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateProfile(userId: string, dto: UpdateCustomerDto) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...(dto.name ? { name: dto.name } : {}),
            ...(dto.email ? { email: dto.email } : {}),
            ...(dto.lang ? { lang: dto.lang } : {}),
          },
        });
      } catch {
        // Fallback below
      }
    }

    return {
      id: userId,
      name: dto.name || 'Michał Kowalski',
      email: dto.email || 'michal.kowalski@example.pl',
      lang: dto.lang || 'pl',
      updatedAt: new Date(),
    };
  }

  async getCustomerOrders(userId: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.order.findMany({
          where: { userId },
          include: {
            device: true,
            workshop: true,
            diagnosticReport: true,
            shipments: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        return [];
      }
    }
    return [];
  }
}
