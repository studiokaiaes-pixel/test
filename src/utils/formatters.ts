/**
 * Utilidades y formateadores para KAIA Business Management System
 */

export function formatDateES(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateTimeES(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return formatDateES(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0,00 €';
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(days: number, fromDate?: string): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateNextId(prefix: string, existingIds: string[], yearFormat = false): string {
  const currentYear = new Date().getFullYear();
  const fullPrefix = yearFormat ? `${prefix}-${currentYear}-` : `${prefix}-`;

  const numbers = existingIds
    .filter((id) => id && id.startsWith(fullPrefix))
    .map((id) => {
      const rest = id.replace(fullPrefix, '');
      const parsed = parseInt(rest, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `${fullPrefix}${String(nextNum).padStart(4, '0')}`;
}

export function calculateLineTotal(
  cantidad: number,
  precioUnitario: number,
  iva: number,
  descuento: number
): { subtotal: number; descuentoAmount: number; baseImponible: number; ivaAmount: number; total: number } {
  const gross = (cantidad || 0) * (precioUnitario || 0);
  const descuentoAmount = gross * ((descuento || 0) / 100);
  const baseImponible = gross - descuentoAmount;
  const ivaAmount = baseImponible * ((iva || 0) / 100);
  const total = baseImponible + ivaAmount;
  return {
    subtotal: gross,
    descuentoAmount,
    baseImponible,
    ivaAmount,
    total,
  };
}
