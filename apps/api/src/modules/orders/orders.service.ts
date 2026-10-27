import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EscrowStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';
import { OrderStatusType } from '../../common/fsm/order-fsm.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';
import { AdjustQuoteDto, ApproveAdjustmentDto, RejectAdjustmentDto } from './dto/adjust-quote.dto';
import { MoneyUtil } from '../../common/money/money.util';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  workshopId: string | null;
  deviceId: string;
  status: OrderStatus;
  totalGrosze: number;
  repairGrosze: number;
  logisticsGrosze: number;
  paymentMethod: string | null;
  escrowStatus: EscrowStatus;
  deliveryMethod: string | null;
  returnMethod: string | null;
  inpostCode: string | null;
  pendingAdjustmentGrosze?: number | null;
  createdAt: Date;
  updatedAt: Date;
  events: any[];
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly memoryOrders = new Map<string, OrderRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fsmService: OrderFsmService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const repairGrosze = dto.repairGrosze || 0;
    const logisticsGrosze = dto.logisticsGrosze || 1999; // Default 19.99 PLN in grosz

    MoneyUtil.assertValidGrosze(repairGrosze, 'repairGrosze');
    MoneyUtil.assertValidGrosze(logisticsGrosze, 'logisticsGrosze');

    const totalGrosze = repairGrosze + logisticsGrosze;
    const initialStatus: OrderStatus = repairGrosze > 0 ? OrderStatus.Diagnosed : OrderStatus.Draft;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RG-${dateStr}-${randomSuffix}`;

    const orderId = `ord-${Date.now()}`;

    if (this.prisma.isConnected) {
      try {
        const order = await this.prisma.order.create({
          data: {
            id: orderId,
            orderNumber,
            userId,
            workshopId: dto.workshopId ?? null,
            deviceId: dto.deviceId,
            status: initialStatus,
            repairGrosze,
            logisticsGrosze,
            totalGrosze,
            deliveryMethod: dto.deliveryMethod ?? 'INPOST_PACZKOMAT',
            returnMethod: dto.returnMethod ?? 'INPOST_PACZKOMAT',
            inpostCode: dto.inpostCode ?? null,
            events: {
              create: {
                fromStatus: null,
                toStatus: initialStatus,
                actor: 'CUSTOMER',
                metadata: { initialEstimateGrosze: repairGrosze },
              },
            },
          },
          include: {
            events: true,
            device: true,
            workshop: true,
          },
        });
        return order;
      } catch (err) {
        this.logger.warn(`Could not save order to DB, falling back to memory: ${err}`);
      }
    }

    const memOrder: OrderRecord = {
      id: orderId,
      orderNumber,
      userId,
      workshopId: dto.workshopId || null,
      deviceId: dto.deviceId,
      status: initialStatus,
      totalGrosze,
      repairGrosze,
      logisticsGrosze,
      paymentMethod: null,
      escrowStatus: EscrowStatus.PENDING,
      deliveryMethod: dto.deliveryMethod || 'INPOST_PACZKOMAT',
      returnMethod: dto.returnMethod || 'INPOST_PACZKOMAT',
      inpostCode: dto.inpostCode || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [
        {
          id: `evt-${Date.now()}`,
          orderId,
          fromStatus: null,
          toStatus: initialStatus,
          actor: 'CUSTOMER',
          createdAt: new Date(),
          metadata: { initialEstimateGrosze: repairGrosze },
        },
      ],
    };
    this.memoryOrders.set(orderId, memOrder);
    return memOrder;
  }

  async listOrders(filters?: { userId?: string; status?: OrderStatus; workshopId?: string }) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.order.findMany({
          where: {
            ...(filters?.userId ? { userId: filters.userId } : {}),
            ...(filters?.status ? { status: filters.status } : {}),
            ...(filters?.workshopId ? { workshopId: filters.workshopId } : {}),
          },
          include: {
            device: true,
            workshop: true,
            diagnosticReport: true,
            shipments: true,
            events: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Fallback
      }
    }

    let list = Array.from(this.memoryOrders.values());
    if (filters?.userId) {
      list = list.filter((o) => o.userId === filters.userId);
    }
    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.workshopId) {
      list = list.filter((o) => o.workshopId === filters.workshopId);
    }
    return list;
  }

  async getOrderById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const order = await this.prisma.order.findUnique({
          where: { id },
          include: {
            device: true,
            workshop: true,
            diagnosticReport: true,
            shipments: true,
            invoices: true,
            events: { orderBy: { createdAt: 'asc' } },
          },
        });
        if (order) return order;
      } catch {
        // Fallback
      }
    }

    const order = this.memoryOrders.get(id);
    if (!order) {
      throw new NotFoundException(`Zlecenie o ID '${id}' nie istnieje.`);
    }
    return order;
  }

  async transitionStatus(orderId: string, dto: TransitionOrderDto) {
    const order = await this.getOrderById(orderId);

    // CRITICAL: Order status transitions ONLY through FSM
    this.fsmService.validateTransition(
      order.status as OrderStatusType,
      dto.toStatus,
    );

    const fromStatus = order.status;
    const toStatus = dto.toStatus as OrderStatus;
    const actor = dto.actor || 'SYSTEM';

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: toStatus,
            events: {
              create: {
                fromStatus,
                toStatus,
                actor,
                metadata: dto.metadata ? (dto.metadata as any) : undefined,
              },
            },
          },
          include: {
            events: { orderBy: { createdAt: 'desc' } },
          },
        });
        return updated;
      } catch (err) {
        this.logger.warn(`Could not update order transition in DB: ${err}`);
      }
    }

    const mem = this.memoryOrders.get(orderId)!;
    mem.status = toStatus;
    mem.updatedAt = new Date();
    mem.events.push({
      id: `evt-${Date.now()}`,
      orderId,
      fromStatus,
      toStatus,
      actor,
      metadata: dto.metadata,
      createdAt: new Date(),
    });

    return mem;
  }

  async proposePriceAdjustment(orderId: string, dto: AdjustQuoteDto, technicianId = 'TECH-AUTO') {
    MoneyUtil.assertValidGrosze(dto.newRepairGrosze, 'newRepairGrosze');
    const order = await this.getOrderById(orderId);

    if (order.status !== OrderStatus.ReceivedAtWorkshop && order.status !== OrderStatus.InspectionConfirmed) {
      throw new BadRequestException(
        `Korekta wyceny może nastąpić tylko ze statusu 'ReceivedAtWorkshop' lub 'InspectionConfirmed'. Aktualny status: '${order.status}'.`,
      );
    }

    // Advance FSM to PriceAdjustmentNeeded
    return this.transitionStatus(orderId, {
      toStatus: 'PriceAdjustmentNeeded',
      actor: 'TECHNICIAN',
      metadata: {
        newRepairGrosze: dto.newRepairGrosze,
        newRepairFormatted: MoneyUtil.formatPln(dto.newRepairGrosze),
        reason: dto.reason,
        evidencePhotoUrls: dto.evidencePhotoUrls,
        technicianId,
      },
    });
  }

  async approvePriceAdjustment(orderId: string, dto: ApproveAdjustmentDto, userId: string) {
    const order = await this.getOrderById(orderId);

    if (order.status !== OrderStatus.PriceAdjustmentNeeded) {
      throw new BadRequestException(
        `Można zatwierdzić korektę tylko dla zleceń w statusie 'PriceAdjustmentNeeded'. Aktualny status: '${order.status}'.`,
      );
    }

    // Retrieve adjusted amount from latest event metadata
    const events = (order as any).events || [];
    const adjustEvent = [...events].reverse().find((e) => e.toStatus === 'PriceAdjustmentNeeded');
    const newRepairGrosze = adjustEvent?.metadata?.newRepairGrosze || order.repairGrosze;

    MoneyUtil.assertValidGrosze(newRepairGrosze, 'newRepairGrosze');
    const newTotalGrosze = newRepairGrosze + order.logisticsGrosze;

    if (this.prisma.isConnected) {
      try {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            repairGrosze: newRepairGrosze,
            totalGrosze: newTotalGrosze,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to update adjusted price in DB: ${err}`);
      }
    } else {
      const mem = this.memoryOrders.get(orderId);
      if (mem) {
        mem.repairGrosze = newRepairGrosze;
        mem.totalGrosze = newTotalGrosze;
      }
    }

    return this.transitionStatus(orderId, {
      toStatus: 'InspectionConfirmed',
      actor: 'CUSTOMER',
      metadata: {
        customerApproval: true,
        approvedTotalGrosze: newTotalGrosze,
        approvedTotalFormatted: MoneyUtil.formatPln(newTotalGrosze),
        notes: dto.notes,
        customerId: userId,
      },
    });
  }

  async rejectPriceAdjustment(orderId: string, dto: RejectAdjustmentDto, userId: string) {
    const order = await this.getOrderById(orderId);

    if (order.status !== OrderStatus.PriceAdjustmentNeeded) {
      throw new BadRequestException(
        `Można odrzucić korektę tylko dla zleceń w statusie 'PriceAdjustmentNeeded'. Aktualny status: '${order.status}'.`,
      );
    }

    return this.transitionStatus(orderId, {
      toStatus: 'CancelledAndReturned',
      actor: 'CUSTOMER',
      metadata: {
        customerApproval: false,
        rejectionReason: dto.reason || 'Klient nie zaakceptował nowej wyceny naprawy',
        customerId: userId,
      },
    });
  }
}
