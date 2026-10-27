import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateShipmentInput,
  ILogisticsPort,
  InPostLockerPoint,
  LOGISTICS_PORT,
  ShipmentResult,
  TrackingCheckpoint,
} from './ports/logistics.port';
import { InPostWebhookDto } from './dto/inpost-webhook.dto';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';

interface ShipmentRecord {
  id: string;
  orderId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  method: string;
  labelUrl: string | null;
  createdAt: Date;
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);
  private readonly memoryShipments = new Map<string, ShipmentRecord>();

  constructor(
    @Inject(LOGISTICS_PORT)
    private readonly logisticsPort: ILogisticsPort,
    private readonly prisma: PrismaService,
    private readonly fsmService: OrderFsmService,
  ) {}

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const result = await this.logisticsPort.createShipment(input);

    const record: ShipmentRecord = {
      id: result.shipmentId,
      orderId: input.orderId,
      trackingNumber: result.trackingNumber,
      status: ShipmentStatus.LABEL_GENERATED,
      method: 'INPOST_PACZKOMAT',
      labelUrl: result.labelUrl,
      createdAt: new Date(),
    };

    if (this.prisma.isConnected) {
      try {
        await this.prisma.shipment.create({
          data: {
            id: record.id,
            orderId: record.orderId,
            trackingNumber: record.trackingNumber,
            status: record.status,
            method: record.method,
            labelUrl: record.labelUrl,
          },
        });

        // If order exists and is in OrderConfirmed, advance FSM to LabelGenerated
        const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
        if (order && order.status === 'OrderConfirmed') {
          this.fsmService.validateTransition(order.status, 'LabelGenerated');
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'LabelGenerated' },
          });
          await this.prisma.orderStatusEvent.create({
            data: {
              orderId: order.id,
              fromStatus: 'OrderConfirmed',
              toStatus: 'LabelGenerated',
              actor: 'SYSTEM_LOGISTICS',
              metadata: { trackingNumber: result.trackingNumber, labelUrl: result.labelUrl },
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Could not save shipment to DB, saving in memory: ${err}`);
      }
    }

    this.memoryShipments.set(record.id, record);
    this.memoryShipments.set(record.trackingNumber, record);

    return result;
  }

  async getTracking(identifier: string): Promise<TrackingCheckpoint[]> {
    let trackingNumber = identifier;

    // Check if identifier is shipmentId
    const record = this.memoryShipments.get(identifier);
    if (record) {
      trackingNumber = record.trackingNumber;
    } else if (this.prisma.isConnected) {
      try {
        const dbShipment = await this.prisma.shipment.findFirst({
          where: { OR: [{ id: identifier }, { trackingNumber: identifier }] },
        });
        if (dbShipment) {
          trackingNumber = dbShipment.trackingNumber;
        }
      } catch {
        // Fallback
      }
    }

    return this.logisticsPort.getTracking(trackingNumber);
  }

  async handleInPostWebhook(dto: InPostWebhookDto): Promise<{ acknowledged: boolean }> {
    this.logger.log(`Received InPost webhook for parcel ${dto.trackingNumber}: status=${dto.status}`);

    const shipment = this.memoryShipments.get(dto.trackingNumber);
    if (shipment) {
      if (dto.status.includes('adopted') || dto.status.includes('in_transit')) {
        shipment.status = ShipmentStatus.IN_TRANSIT;
      } else if (dto.status.includes('delivered')) {
        shipment.status = ShipmentStatus.DELIVERED;
      }
    }

    if (this.prisma.isConnected) {
      try {
        const dbShipment = await this.prisma.shipment.findFirst({
          where: { trackingNumber: dto.trackingNumber },
          include: { order: true },
        });

        if (dbShipment && dbShipment.order) {
          const order = dbShipment.order;
          if (dto.status.includes('adopted') && order.status === 'LabelGenerated') {
            await this.prisma.order.update({
              where: { id: order.id },
              data: { status: 'InTransitToHub' },
            });
            await this.prisma.orderStatusEvent.create({
              data: {
                orderId: order.id,
                fromStatus: 'LabelGenerated',
                toStatus: 'InTransitToHub',
                actor: 'COURIER_INPOST_WEBHOOK',
                metadata: { webhookStatus: dto.status },
              },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Error processing InPost webhook in DB: ${err}`);
      }
    }

    return { acknowledged: true };
  }

  async searchLockers(query: string): Promise<InPostLockerPoint[]> {
    return this.logisticsPort.searchLockers(query);
  }
}
