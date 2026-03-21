export function formatDateEs(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMoneyEs(amount: number) {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount}€`;
  return `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} €`;
}

export function formatTime24(timeHHMM?: string) {
  // Stored as "HH:MM" already, keep it (24h)
  if (!timeHHMM) return '';
  return timeHHMM.slice(0, 5);
}

