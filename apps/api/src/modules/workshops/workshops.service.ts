import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { QueryWorkshopsDto } from './dto/query-workshops.dto';

export interface WorkshopRecord {
  id: string;
  name: string;
  area: string;
  spec: string;
  rating: number;
  reviewCount: number;
  dist: number;
  priceMultiplier: number;
  days: number;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  isPromoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WorkshopsService {
  private readonly memoryWorkshops: WorkshopRecord[] = [
    {
      id: 'ws-waw-1',
      name: 'iHospital Warszawa Centrum',
      area: 'Warszawa Śródmieście',
      spec: 'Apple, iPhone, MacBook, iPad, AirPods',
      rating: 4.92,
      reviewCount: 480,
      dist: 2.4,
      priceMultiplier: 1.1,
      days: 2,
      phone: '+48221002030',
      lat: 52.2319,
      lng: 21.0067,
      isPromoted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ws-kra-1',
      name: 'FixLab Kraków Krowodrza',
      area: 'Kraków Krowodrza',
      spec: 'Apple, Samsung, Xiaomi, Laptopy Dell & Lenovo',
      rating: 4.85,
      reviewCount: 312,
      dist: 3.8,
      priceMultiplier: 0.95,
      days: 3,
      phone: '+48123004050',
      lat: 50.0712,
      lng: 19.9248,
      isPromoted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ws-wro-1',
      name: 'SerwisPro Wrocław Krzyki',
      area: 'Wrocław Krzyki',
      spec: 'Laptopy Gamingowe, PlayStation 5, Xbox, GPU',
      rating: 4.78,
      reviewCount: 195,
      dist: 5.1,
      priceMultiplier: 1.0,
      days: 2,
      phone: '+48713005060',
      lat: 51.0854,
      lng: 17.0211,
      isPromoted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ws-poznan-1',
      name: 'MasterTech Poznań Grunwald',
      area: 'Poznań Grunwald',
      spec: 'Microsoldering, Zalania cieczą, Naprawa BGA, Apple',
      rating: 4.95,
      reviewCount: 520,
      dist: 4.2,
      priceMultiplier: 1.05,
      days: 4,
      phone: '+48612003040',
      lat: 52.3982,
      lng: 16.8833,
      isPromoted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ws-trojmiasto-1',
      name: 'ElectroFix Trójmiasto',
      area: 'Gdańsk Wrzeszcz',
      spec: 'Smartfony, Tablety, Smartwatche, Akcesoria',
      rating: 4.68,
      reviewCount: 142,
      dist: 6.5,
      priceMultiplier: 0.9,
      days: 3,
      phone: '+48583002010',
      lat: 54.3802,
      lng: 18.6041,
      isPromoted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async listWorkshops(query: QueryWorkshopsDto): Promise<WorkshopRecord[]> {
    let list: WorkshopRecord[] = [];

    if (this.prisma.isConnected) {
      try {
        const count = await this.prisma.workshop.count();
        if (count === 0) {
          // Seed database with mock workshops
          for (const w of this.memoryWorkshops) {
            await this.prisma.workshop.create({ data: w });
          }
        }
        list = await this.prisma.workshop.findMany();
      } catch {
        list = [...this.memoryWorkshops];
      }
    } else {
      list = [...this.memoryWorkshops];
    }

    // Apply filtering
    if (query.spec) {
      const specLower = query.spec.toLowerCase();
      list = list.filter((w) => w.spec.toLowerCase().includes(specLower));
    }

    if (query.area) {
      const areaLower = query.area.toLowerCase();
      list = list.filter((w) => w.area.toLowerCase().includes(areaLower));
    }

    if (query.maxDist) {
      list = list.filter((w) => w.dist <= (query.maxDist ?? Infinity));
    }

    // Apply sorting
    switch (query.sort) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'dist':
        list.sort((a, b) => a.dist - b.dist);
        break;
      case 'price':
        list.sort((a, b) => a.priceMultiplier - b.priceMultiplier);
        break;
      case 'turnaround':
        list.sort((a, b) => a.days - b.days);
        break;
      default:
        list.sort((a, b) => (b.isPromoted ? 1 : 0) - (a.isPromoted ? 1 : 0));
        break;
    }

    return list;
  }

  async getWorkshopById(id: string): Promise<WorkshopRecord> {
    if (this.prisma.isConnected) {
      try {
        const ws = await this.prisma.workshop.findUnique({ where: { id } });
        if (ws) return ws;
      } catch {
        // Fallback below
      }
    }

    const found = this.memoryWorkshops.find((w) => w.id === id);
    if (!found) {
      throw new NotFoundException(`Warsztat o ID '${id}' nie został znaleziony.`);
    }
    return found;
  }
}
