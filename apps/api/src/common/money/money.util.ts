/**
 * Monetary Utility for Repair God
 * 
 * CRITICAL RULE:
 * All monetary amounts in the system MUST be stored and computed as integers in grosze
 * (1 PLN = 100 grosze, 100 PLN = 10000 grosze).
 * Floating point arithmetic for money is strictly prohibited.
 */

export class MoneyUtil {
  /**
   * Asserts that a monetary value is an integer in grosze and non-negative (unless negative allowed).
   */
  static assertValidGrosze(value: number, fieldName = 'Amount'): void {
    if (!Number.isInteger(value)) {
      throw new Error(`${fieldName} must be an integer in grosze. Received: ${value}`);
    }
    if (value < 0) {
      throw new Error(`${fieldName} cannot be negative. Received: ${value}`);
    }
  }

  /**
   * Converts PLN to grosze integer (e.g. 149.99 PLN -> 14999 grosze).
   */
  static plnToGrosze(pln: number): number {
    return Math.round(pln * 100);
  }

  /**
   * Formats grosze integer to PLN string representation (e.g. 14999 grosze -> "149.99 PLN").
   */
  static formatPln(grosze: number): string {
    const pln = (grosze / 100).toFixed(2);
    return `${pln} PLN`;
  }

  /**
   * Calculates VAT amount from gross amount in grosze using integer arithmetic.
   * Default VAT rate in Poland is 23%.
   * Formula: VAT = Gross - (Gross / 1.23) = round(Gross * 23 / 123)
   */
  static calculateVatFromGross(grossGrosze: number, vatRatePercent = 23): number {
    this.assertValidGrosze(grossGrosze, 'grossGrosze');
    return Math.round((grossGrosze * vatRatePercent) / (100 + vatRatePercent));
  }

  /**
   * Calculates net amount from gross amount in grosze.
   */
  static calculateNetFromGross(grossGrosze: number, vatRatePercent = 23): number {
    this.assertValidGrosze(grossGrosze, 'grossGrosze');
    const vat = this.calculateVatFromGross(grossGrosze, vatRatePercent);
    return grossGrosze - vat;
  }
}
