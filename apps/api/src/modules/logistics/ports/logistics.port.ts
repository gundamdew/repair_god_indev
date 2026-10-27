export interface CreateShipmentInput {
  orderId: string;
  senderLockerCode?: string;
  receiverLockerCode?: string;
  senderPhone: string;
  receiverPhone: string;
  parcelSize?: 'A' | 'B' | 'C';
}

export interface ShipmentResult {
  trackingNumber: string;
  shipmentId: string;
  labelUrl: string;
  status: string;
}

export interface TrackingCheckpoint {
  status: string;
  description: string;
  datetime: string;
  location?: string;
}

export interface InPostLockerPoint {
  name: string; // e.g. WAW01A
  address: string;
  city: string;
  postalCode: string;
  locationDescription?: string;
  lat: number;
  lng: number;
}

export const LOGISTICS_PORT = Symbol('LOGISTICS_PORT');

export interface ILogisticsPort {
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingCheckpoint[]>;
  searchLockers(query: string): Promise<InPostLockerPoint[]>;
}
