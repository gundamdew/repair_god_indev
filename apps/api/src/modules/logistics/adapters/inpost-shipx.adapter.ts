import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateShipmentInput,
  ILogisticsPort,
  InPostLockerPoint,
  ShipmentResult,
  TrackingCheckpoint,
} from '../ports/logistics.port';

@Injectable()
export class InPostShipXAdapter implements ILogisticsPort {
  private readonly logger = new Logger(InPostShipXAdapter.name);

  private readonly mockLockers: InPostLockerPoint[] = [
    {
      name: 'WAW01A',
      address: 'Marszałkowska 104',
      city: 'Warszawa',
      postalCode: '00-017',
      locationDescription: 'Przy wejściu do metra Świętokrzyska',
      lat: 52.2355,
      lng: 21.0084,
    },
    {
      name: 'WAW14M',
      address: 'Puławska 42',
      city: 'Warszawa',
      postalCode: '02-512',
      locationDescription: 'Obok sklepu Biedronka',
      lat: 52.2081,
      lng: 21.0215,
    },
    {
      name: 'KRA02M',
      address: 'Karmelicka 15',
      city: 'Kraków',
      postalCode: '31-133',
      locationDescription: 'Przy pasażu handlowym',
      lat: 50.0658,
      lng: 19.9324,
    },
    {
      name: 'WRO05N',
      address: 'Powstańców Śląskich 95',
      city: 'Wrocław',
      postalCode: '53-332',
      locationDescription: 'Parking Sky Tower',
      lat: 51.0945,
      lng: 17.0195,
    },
    {
      name: 'POZ03A',
      address: 'Półwiejska 32',
      city: 'Poznań',
      postalCode: '61-888',
      locationDescription: 'Przy Starym Browarze',
      lat: 52.4019,
      lng: 16.9295,
    },
  ];

  constructor(private readonly configService: ConfigService) {}

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const trackingNumber = `621000${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const shipmentId = `shipx-${Date.now()}`;
    const labelUrl = `https://storage.repairgod.pl/labels/inpost-${trackingNumber}.pdf`;

    this.logger.log(
      `[InPost ShipX Mock] Created shipment for Order ${input.orderId}: tracking=${trackingNumber}, from=${
        input.senderLockerCode || 'Courier pickup'
      } to=${input.receiverLockerCode || 'Hub/Workshop'}`,
    );

    return {
      trackingNumber,
      shipmentId,
      labelUrl,
      status: 'LABEL_GENERATED',
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingCheckpoint[]> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursAgo = new Date(now.getTime() - 7200000);

    return [
      {
        status: 'CONFIRMED',
        description: 'Etykieta nadawcza została wygenerowana w systemie InPost ShipX.',
        datetime: twoHoursAgo.toISOString(),
      },
      {
        status: 'ADOPTED_AT_SOURCE_BRANCH',
        description: 'Paczka umieszczona w Paczkomacie przez nadawcę.',
        datetime: oneHourAgo.toISOString(),
        location: 'Warszawa WAW01A',
      },
      {
        status: 'IN_TRANSIT',
        description: 'Przesyłka odebrana przez kuriera InPost, w drodze do sortowni głównej.',
        datetime: now.toISOString(),
        location: 'Węzeł Logistyczny Warszawa',
      },
    ];
  }

  async searchLockers(query: string): Promise<InPostLockerPoint[]> {
    if (!query || query.trim() === '') {
      return this.mockLockers;
    }
    const q = query.toLowerCase().trim();
    return this.mockLockers.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.postalCode.includes(q),
    );
  }
}
