/** Maps currency codes to ISO 3166-1 alpha-2 country codes for flagcdn */
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  SAR: "sa",
  AED: "ae",
  KWD: "kw",
  BHD: "bh",
  QAR: "qa",
  OMR: "om",
  EGP: "eg",
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  MAD: "ma",
  TRY: "tr",
  MRU: "mr",
  TND: "tn",
  JOD: "jo",
  IQD: "iq",
  LYD: "ly",
  SDG: "sd",
  DZD: "dz",
  LBP: "lb",
  YER: "ye",
  SYP: "sy",
};

/**
 * Get the flagcdn SVG URL for a currency code.
 * Returns null if no mapping exists.
 */
export function getFlagUrl(currencyCode: string | null | undefined): string | null {
  if (!currencyCode) return null;
  const country = CURRENCY_TO_COUNTRY[currencyCode.toUpperCase()];
  if (!country) return null;
  return `https://flagcdn.com/${country}.svg`;
}

/**
 * Get the country code for a given currency code.
 */
export function getCountryCode(currencyCode: string | null | undefined): string | null {
  if (!currencyCode) return null;
  return CURRENCY_TO_COUNTRY[currencyCode.toUpperCase()] || null;
}
