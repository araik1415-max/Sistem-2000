import { Language } from '../types';

/**
 * Ֆորմատավորում է համակարգի օգտագործման ժամանակը
 */
export function formatUsageDuration(totalSeconds: number, lang: Language): string {
  const isHy = lang === 'hy';
  const sec = Math.max(0, Math.floor(totalSeconds));

  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (days > 0) {
    return isHy
      ? `${days} օր ${hours} ժ ${minutes} ր`
      : `${days} д ${hours} ч ${minutes} мин`;
  }

  if (hours > 0) {
    return isHy
      ? `${hours} ժ ${minutes} ր ${seconds} վրկ`
      : `${hours} ч ${minutes} мин ${seconds} сек`;
  }

  if (minutes > 0) {
    return isHy
      ? `${minutes} ր ${seconds} վրկ`
      : `${minutes} мин ${seconds} сек`;
  }

  return isHy ? `${seconds} վայրկյան` : `${seconds} сек`;
}

/**
 * Հաշվարկում է կատարված ֆինանսական գործարքների քանակը
 */
export function countFinancialTransactions(logs: Array<{ category: string }>): number {
  return logs.filter((l) =>
    ['deposit', 'real_topup', 'dram_purchase', 'points_purchase'].includes(l.category)
  ).length;
}
