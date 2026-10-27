import { z } from 'zod';

export const ORDER_STATUSES = [
  'Draft',
  'Diagnosed',
  'OrderConfirmed',
  'LabelGenerated',
  'InTransitToHub',
  'ReceivedAtWorkshop',
  'PriceAdjustmentNeeded',
  'InspectionConfirmed',
  'RepairInProgress',
  'QualityControl',
  'ReturnInTransit',
  'Delivered',
  'FundsReleased',
  'Closed',
  'Cancelled',
  'CancelledAndReturned',
  'Disputed',
  'UnderInvestigation',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderStatusVariant = 'default' | 'info' | 'warning' | 'success' | 'error' | 'muted' | 'accent';

export interface OrderStatusDetails {
  status: OrderStatus;
  label: string;
  description: string;
  variant: OrderStatusVariant;
  progress: number; // 0 - 100
  customerStep: number; // 1 - 5
  stepTitle: string;
}

export const TOTAL_ORDER_STEPS = 5 as const;

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusDetails> = {
  Draft: {
    status: 'Draft',
    label: 'Szkic zgłoszenia',
    description: 'Wybór urządzenia i objawów w trakcie przygotowywania',
    variant: 'muted',
    progress: 5,
    customerStep: 1,
    stepTitle: 'Zgłoszenie',
  },
  Diagnosed: {
    status: 'Diagnosed',
    label: 'Zdiagnozowano (AI)',
    description: 'Wstępna diagnoza i szacunkowy kosztorys zostały wygenerowane',
    variant: 'info',
    progress: 15,
    customerStep: 1,
    stepTitle: 'Zgłoszenie',
  },
  OrderConfirmed: {
    status: 'OrderConfirmed',
    label: 'Zamówienie potwierdzone',
    description: 'Płatność autoryzowana w escrow, przygotowywanie etykiety wysyłkowej',
    variant: 'info',
    progress: 25,
    customerStep: 1,
    stepTitle: 'Zgłoszenie',
  },
  LabelGenerated: {
    status: 'LabelGenerated',
    label: 'Etykieta nadawcza gotowa',
    description: 'Etykieta InPost Paczkomat jest gotowa. Umieść urządzenie w Paczkomacie.',
    variant: 'info',
    progress: 35,
    customerStep: 2,
    stepTitle: 'Wysyłka',
  },
  InTransitToHub: {
    status: 'InTransitToHub',
    label: 'W drodze do serwisu',
    description: 'Paczka została nadana i zmierza do partnerskiego warsztatu naprawczego',
    variant: 'info',
    progress: 45,
    customerStep: 2,
    stepTitle: 'Wysyłka',
  },
  ReceivedAtWorkshop: {
    status: 'ReceivedAtWorkshop',
    label: 'Przyjęte w serwisie',
    description: 'Warsztat potwierdził przyjęcie przesyłki. Trwa weryfikacja diagnostyczna.',
    variant: 'accent',
    progress: 55,
    customerStep: 3,
    stepTitle: 'Diagnoza i Serwis',
  },
  PriceAdjustmentNeeded: {
    status: 'PriceAdjustmentNeeded',
    label: 'Wymaga akceptacji nowej wyceny',
    description: 'Technik wykrył dodatkowe uszkodzenia. Wymagana Twoja akceptacja zakresu prac.',
    variant: 'warning',
    progress: 60,
    customerStep: 3,
    stepTitle: 'Diagnoza i Serwis',
  },
  InspectionConfirmed: {
    status: 'InspectionConfirmed',
    label: 'Diagnoza zatwierdzona',
    description: 'Technik potwierdził zakres prac. Urządzenie oczekuje na realizację naprawy.',
    variant: 'info',
    progress: 65,
    customerStep: 3,
    stepTitle: 'Diagnoza i Serwis',
  },
  RepairInProgress: {
    status: 'RepairInProgress',
    label: 'Naprawa w toku',
    description: 'Certyfikowany serwis wymienia części i usuwa zgłoszone usterki.',
    variant: 'accent',
    progress: 75,
    customerStep: 3,
    stepTitle: 'Diagnoza i Serwis',
  },
  QualityControl: {
    status: 'QualityControl',
    label: 'Kontrola jakości (QC)',
    description: 'Naprawa ukończona. Sprzęt przechodzi testy funkcjonalne i dokumentację fotograficzną.',
    variant: 'accent',
    progress: 85,
    customerStep: 4,
    stepTitle: 'Kontrola i Powrót',
  },
  ReturnInTransit: {
    status: 'ReturnInTransit',
    label: 'W drodze powrotnej',
    description: 'Sprzęt przeszedł QC i został nadany kurierem InPost w drodze do Twojego Paczkomatu.',
    variant: 'info',
    progress: 95,
    customerStep: 4,
    stepTitle: 'Kontrola i Powrót',
  },
  Delivered: {
    status: 'Delivered',
    label: 'Dostarczone do odbioru',
    description: 'Paczka czeka w Paczkomacie lub została odebrana. 48h na potwierdzenie sprawności.',
    variant: 'success',
    progress: 100,
    customerStep: 5,
    stepTitle: 'Odbiór i Gwarancja',
  },
  FundsReleased: {
    status: 'FundsReleased',
    label: 'Środki przekazane serwisowi',
    description: 'Klient zaakceptował naprawę lub minęło okno 48h. Gwarancja platformy aktywna.',
    variant: 'success',
    progress: 100,
    customerStep: 5,
    stepTitle: 'Odbiór i Gwarancja',
  },
  Closed: {
    status: 'Closed',
    label: 'Zlecenie zakończone',
    description: 'Naprawa pomyślnie zrealizowana, środki rozliczone, faktura wystawiona.',
    variant: 'success',
    progress: 100,
    customerStep: 5,
    stepTitle: 'Odbiór i Gwarancja',
  },
  Cancelled: {
    status: 'Cancelled',
    label: 'Anulowane',
    description: 'Zlecenie zostało anulowane przed rozpoczęciem naprawy.',
    variant: 'muted',
    progress: 0,
    customerStep: 1,
    stepTitle: 'Anulowano',
  },
  CancelledAndReturned: {
    status: 'CancelledAndReturned',
    label: 'Anulowane i odesłane',
    description: 'Klient odrzucił nową wycenę. Urządzenie zostało odesłane z powrotem.',
    variant: 'muted',
    progress: 0,
    customerStep: 4,
    stepTitle: 'Zwrot sprzętu',
  },
  Disputed: {
    status: 'Disputed',
    label: 'Zgłoszono reklamację',
    description: 'Klient zgłosił zastrzeżenie w 48-godzinnym oknie weryfikacyjnym.',
    variant: 'error',
    progress: 100,
    customerStep: 5,
    stepTitle: 'Reklamacja',
  },
  UnderInvestigation: {
    status: 'UnderInvestigation',
    label: 'Weryfikacja zgłoszenia',
    description: 'Dział obsługi klienta Repair God weryfikuje zasadność zgłoszenia.',
    variant: 'warning',
    progress: 100,
    customerStep: 5,
    stepTitle: 'Weryfikacja',
  },
};

/**
 * Returns the human-readable Polish label for an order status.
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.label ?? status;
}

/**
 * Returns the detailed Polish explanation for an order status.
 */
export function getOrderStatusDescription(status: OrderStatus): string {
  return ORDER_STATUS_MAP[status]?.description ?? '';
}

/**
 * Returns badge color tone/variant for the status badge.
 */
export function getOrderStatusVariant(status: OrderStatus): OrderStatusVariant {
  return ORDER_STATUS_MAP[status]?.variant ?? 'default';
}

/**
 * Returns progression percentage (0 - 100) for progress bars.
 */
export function getOrderProgress(status: OrderStatus): number {
  return ORDER_STATUS_MAP[status]?.progress ?? 0;
}

/**
 * Returns active timeline step info for multi-step progress indicators.
 */
export function getOrderStepInfo(status: OrderStatus): {
  step: number;
  totalSteps: number;
  stepTitle: string;
} {
  const details = ORDER_STATUS_MAP[status];
  return {
    step: details?.customerStep ?? 1,
    totalSteps: TOTAL_ORDER_STEPS,
    stepTitle: details?.stepTitle ?? 'Zgłoszenie',
  };
}

/**
 * Indicates whether user action is currently required.
 * e.g., approving price adjustment or accepting delivered package.
 */
export function isActionRequiredByCustomer(status: OrderStatus): boolean {
  return status === 'PriceAdjustmentNeeded' || status === 'Delivered';
}

/**
 * Checks whether an order is in a final, completed or cancelled state.
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    status === 'Closed' ||
    status === 'Cancelled' ||
    status === 'CancelledAndReturned'
  );
}

/**
 * Checks whether the order is currently active (in progress).
 */
export function isOrderActive(status: OrderStatus): boolean {
  return !isTerminalStatus(status);
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const orderStatusSchema = z.enum(ORDER_STATUSES);
