export type Currency = "USD" | "EUR" | "GBP";

const formatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  EUR: new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
  GBP: new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }),
};

const plainFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Prefix shown inside money inputs. */
export const CURRENCY_PREFIX: Record<Currency, string> = { USD: "US$", EUR: "€", GBP: "£" };

export const money = (n: number, currency: Currency = "USD") => formatters[currency].format(n);
export const usd = (n: number) => money(n, "USD");
export const num = (n: number) => plainFormatter.format(n);
