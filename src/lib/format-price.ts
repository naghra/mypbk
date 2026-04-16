import { CURRENCIES, CurrencyConfig } from "@/hooks/useCurrency";

const DEFAULT_SYMBOL = "ريال سعودي";

export interface ProductCurrency {
  currency_enabled?: boolean;
  currency_code?: string | null;
}

/**
 * Returns the display symbol for a product.
 * If product has currency override enabled, use that; otherwise fallback to system currency.
 */
export function getProductCurrencySymbol(
  product: ProductCurrency | null | undefined,
  systemCurrency: CurrencyConfig
): string {
  if (product?.currency_enabled && product.currency_code) {
    const found = CURRENCIES.find((c) => c.code === product.currency_code);
    return found?.symbol || systemCurrency.symbol;
  }
  return systemCurrency.symbol;
}

/**
 * Format a price with the correct currency symbol.
 */
export function formatPrice(
  value: number,
  product?: ProductCurrency | null,
  systemCurrency?: CurrencyConfig
): string {
  const symbol = systemCurrency
    ? getProductCurrencySymbol(product, systemCurrency)
    : DEFAULT_SYMBOL;
  return `${value.toLocaleString("en-US")} ${symbol}`;
}
