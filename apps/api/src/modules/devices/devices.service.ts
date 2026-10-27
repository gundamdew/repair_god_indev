import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

export interface DeviceCatalogCategory {
  id: string;
  name: string;
  brands: {
    name: string;
    models: string[];
  }[];
}

export interface DeviceRecord {
  id: string;
  userId: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  imei: string | null;
  condition: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DevicesService {
  private readonly memoryDevices = new Map<string, DeviceRecord>();

  constructor(private readonly prisma: PrismaService) {
    // Seed default sample device for demo
    const defaultDev: DeviceRecord = {
      id: 'dev-demo-iphone-15-pro',
      userId: 'usr-default-demo-1',
      category: 'SMARTPHONE',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      serialNumber: 'DNQZL0A00D1P',
      imei: '356938035643803',
      condition: 'Pęknięta szybka, dotyk działa',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memoryDevices.set(defaultDev.id, defaultDev);
  }

  getCatalog(): DeviceCatalogCategory[] {
    return [
      {
        id: 'SMARTPHONE',
        name: 'Smartfony',
        brands: [
          {
            name: 'Apple',
            models: ['iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13'],
          },
          {
            name: 'Samsung',
            models: ['Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy S23', 'Galaxy Z Fold 5', 'Galaxy A54'],
          },
          {
            name: 'Xiaomi',
            models: ['Xiaomi 14', 'Xiaomi 13T Pro', 'Redmi Note 13 Pro', 'POCO F5'],
          },
          {
            name: 'Google',
            models: ['Pixel 9 Pro', 'Pixel 9', 'Pixel 8 Pro', 'Pixel 8', 'Pixel 7a'],
          },
        ],
      },
      {
        id: 'LAPTOP',
        name: 'Laptopy',
        brands: [
          {
            name: 'Apple',
            models: ['MacBook Pro 14" (M3)', 'MacBook Pro 16" (M3)', 'MacBook Air 13" (M2)', 'MacBook Air 15"'],
          },
          {
            name: 'Lenovo',
            models: ['ThinkPad X1 Carbon', 'ThinkPad T14', 'Legion Pro 5', 'Yoga 9i'],
          },
          {
            name: 'Dell',
            models: ['XPS 15', 'XPS 13', 'Latitude 5540', 'Alienware m16'],
          },
          {
            name: 'ASUS',
            models: ['ROG Zephyrus G14', 'Zenbook 14 OLED', 'TUF Gaming A15'],
          },
        ],
      },
      {
        id: 'TABLET',
        name: 'Tablety',
        brands: [
          {
            name: 'Apple',
            models: ['iPad Pro 11"', 'iPad Pro 13" (M4)', 'iPad Air (M2)', 'iPad 10th Gen', 'iPad mini'],
          },
          {
            name: 'Samsung',
            models: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9', 'Galaxy Tab S9 FE'],
          },
        ],
      },
      {
        id: 'CONSOLE',
        name: 'Konsole do gier',
        brands: [
          {
            name: 'Sony',
            models: ['PlayStation 5 Slim', 'PlayStation 5', 'PlayStation 4 Pro'],
          },
          {
            name: 'Microsoft',
            models: ['Xbox Series X', 'Xbox Series S'],
          },
          {
            name: 'Nintendo',
            models: ['Switch OLED', 'Switch v2', 'Switch Lite'],
          },
          {
            name: 'Valve',
            models: ['Steam Deck OLED', 'Steam Deck LCD'],
          },
        ],
      },
    ];
  }

  async getUserDevices(userId: string): Promise<DeviceRecord[]> {
    if (this.prisma.isConnected) {
      try {
        const devices = await this.prisma.device.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        return devices;
      } catch {
        // Fallback below
      }
    }
    return Array.from(this.memoryDevices.values()).filter((d) => d.userId === userId);
  }

  async getDeviceById(id: string): Promise<DeviceRecord> {
    if (this.prisma.isConnected) {
      try {
        const device = await this.prisma.device.findUnique({ where: { id } });
        if (device) return device;
      } catch {
        // Fallback below
      }
    }
    const mem = this.memoryDevices.get(id);
    if (!mem) {
      throw new NotFoundException(`Urządzenie o ID '${id}' nie istnieje.`);
    }
    return mem;
  }

  async createDevice(userId: string, dto: CreateDeviceDto): Promise<DeviceRecord> {
    if (this.prisma.isConnected) {
      try {
        const device = await this.prisma.device.create({
          data: {
            userId,
            category: dto.category,
            brand: dto.brand,
            model: dto.model,
            serialNumber: dto.serialNumber ?? null,
            imei: dto.imei ?? null,
            condition: dto.condition ?? null,
          },
        });
        return device;
      } catch {
        // Fallback below
      }
    }

    const device: DeviceRecord = {
      id: `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      category: dto.category,
      brand: dto.brand,
      model: dto.model,
      serialNumber: dto.serialNumber || null,
      imei: dto.imei || null,
      condition: dto.condition || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memoryDevices.set(device.id, device);
    return device;
  }

  async deleteDevice(id: string, userId: string): Promise<{ success: boolean }> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.device.delete({ where: { id } });
        return { success: true };
      } catch {
        // Fallback below
      }
    }
    const dev = this.memoryDevices.get(id);
    if (dev && dev.userId === userId) {
      this.memoryDevices.delete(id);
      return { success: true };
    }
    throw new NotFoundException('Urządzenie nie zostało znalezione');
  }
}
