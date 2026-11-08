const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const usd = (n: number) => usdFormatter.format(n);
export const num = (n: number) => plainFormatter.format(n);
