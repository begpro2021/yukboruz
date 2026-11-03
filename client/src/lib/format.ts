export function formatUzs(amount: number): string {
  return `${new Intl.NumberFormat("uz-UZ").format(amount)} so'm`;
}

export function relativeDate(value: string | null): string {
  if (!value) return "Sana ko'rsatilmagan";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
