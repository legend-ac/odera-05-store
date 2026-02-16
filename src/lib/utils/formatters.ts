// lib/utils/formatters.ts

/**
 * Formatea montos en soles peruanos
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
    }).format(amount);
}

/**
 * Formatea fechas en español
 */
export function formatDate(date: Date | string | number): string {
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

/**
 * Formatea solo fecha (sin hora)
 */
export function formatDateOnly(date: Date | string | number): string {
    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}
