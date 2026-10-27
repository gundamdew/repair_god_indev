import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ALLOWED_ORDER_TRANSITIONS,
  OrderStatusType,
} from './order-fsm.constants';

@Injectable()
export class OrderFsmService {
  /**
   * Checks if a transition from fromStatus to toStatus is valid according to FSM rules.
   */
  canTransition(fromStatus: OrderStatusType, toStatus: OrderStatusType): boolean {
    const allowed = ALLOWED_ORDER_TRANSITIONS[fromStatus];
    if (!allowed) {
      return false;
    }
    return allowed.includes(toStatus);
  }

  /**
   * Asserts transition validity. Throws BadRequestException if invalid.
   */
  validateTransition(fromStatus: OrderStatusType, toStatus: OrderStatusType): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      const allowed = this.getAllowedNextStates(fromStatus);
      const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)';
      throw new BadRequestException(
        `Invalid Order FSM transition: cannot transition from '${fromStatus}' to '${toStatus}'. Allowed transitions from '${fromStatus}' are: [${allowedStr}].`,
      );
    }
  }

  /**
   * Returns list of allowed next states from the given status.
   */
  getAllowedNextStates(currentStatus: OrderStatusType): readonly OrderStatusType[] {
    return ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  }
}
