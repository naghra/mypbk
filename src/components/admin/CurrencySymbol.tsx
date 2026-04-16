import sarSymbol from "@/assets/sar-symbol.png";

interface CurrencySymbolProps {
  code: string;
  symbol: string;
  className?: string;
  iconSize?: string;
}

/**
 * Renders the SAR icon image for Saudi Riyal, or text symbol for other currencies.
 * Dashboard-only component.
 */
export function CurrencySymbol({ code, symbol, className = "", iconSize = "h-4 w-4" }: CurrencySymbolProps) {
  if (code === "SAR") {
    return (
      <img
        src={sarSymbol}
        alt="ريال سعودي"
        className={`inline-block ${iconSize} object-contain dark:invert ${className}`}
      />
    );
  }
  return <span className={className}>{symbol}</span>;
}

/** Returns the SAR icon as an inline element or text for use in suffixes */
export function getCurrencySuffix(code: string, symbol: string): string {
  // For non-SAR currencies, return text suffix
  if (code !== "SAR") return ` ${symbol}`;
  // For SAR, return empty - the icon will be rendered separately
  return "";
}
