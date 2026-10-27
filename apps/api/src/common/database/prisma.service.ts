import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to PostgreSQL via Prisma');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `Could not connect to PostgreSQL on startup (${error instanceof Error ? error.message : error}). Backend will operate with graceful mock/in-memory fallback when DB is offline.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Prisma disconnected');
    }
  }
}
