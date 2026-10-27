export interface BlikAuthorizeInput {
  orderId: string;
  blikCode: string;
  amountGrosze: number; // Must be integer
  description?: string;
}

export interface PaymentAuthResult {
  transactionId: string;
  orderId: string;
  amountGrosze: number;
  status: 'AUTHORIZED' | 'FAILED';
  paymentMethod: 'BLIK';
  authorizedAt: Date;
}

export interface EscrowHoldResult {
  escrowId: string;
  orderId: string;
  amountGrosze: number;
  status: 'HELD';
  heldAt: Date;
}

export interface EscrowReleaseResult {
  escrowId: string;
  orderId: string;
  amountGrosze: number;
  status: 'RELEASED';
  releasedAt: Date;
}

export interface EscrowRefundResult {
  escrowId: string;
  orderId: string;
  refundGrosze: number;
  status: 'REFUNDED';
  refundedAt: Date;
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');

export interface IPaymentGatewayPort {
  authorizeBlik(input: BlikAuthorizeInput): Promise<PaymentAuthResult>;
  holdEscrow(orderId: string, amountGrosze: number): Promise<EscrowHoldResult>;
  releaseEscrow(orderId: string, amountGrosze: number): Promise<EscrowReleaseResult>;
  refundEscrow(orderId: string, refundGrosze: number): Promise<EscrowRefundResult>;
}
