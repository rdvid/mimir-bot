import type { ApiErrorKind, PeriodSummary, Transaction } from '../types/api.js';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatHelp(): string {
  return [
    '💰 Personal Finance',
    '',
    'Add an expense:',
    '200 groceries',
    '45 lunch',
    '',
    'Commands:',
    '/today',
    '/week',
    '/summary',
  ].join('\n');
}

export function formatCreated(amount: number, description: string): string {
  return `✅ ${formatCurrency(amount)} — ${description}`;
}

export function formatEmpty(label: string): string {
  return `No transactions ${label}.`;
}

export function formatMalformedInput(): string {
  return ["I couldn't understand that.", '', 'Example:', '200 groceries'].join('\n');
}

export function formatApiError(kind: ApiErrorKind): string {
  switch (kind) {
    case 'network':
      return "❌ Couldn't reach the finance API.";
    case 'auth':
      return '❌ Authentication with the finance API failed.';
    case 'http':
    default:
      return '❌ Finance API request failed.';
  }
}

function displayName(tx: Transaction): string {
  return tx.note?.trim() || tx.categoryName || '—';
}

export function formatTodayList(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return formatEmpty('today');
  }

  const lines = transactions.map((tx) => {
    const prefix = tx.type === 'income' ? '+' : '';
    return `${prefix}${formatCurrency(tx.amount)}  ${displayName(tx)}`;
  });

  const expenseTotal = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return ['💸 Today', '', ...lines, '', `Total: ${formatCurrency(expenseTotal)}`].join('\n');
}

function weekdayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAY_SHORT[date.getUTCDay()];
}

export function formatWeekSummary(transactions: Transaction[], from: string, to: string): string {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  const byDate = new Map<string, number>();

  // Ensure every day in the range appears, even with zero.
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const cursor = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    byDate.set(key, 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const tx of expenses) {
    const dateKey = tx.date.slice(0, 10);
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + tx.amount);
  }

  const dayLines = [...byDate.entries()].map(([date, total]) => {
    const label = weekdayLabel(date).padEnd(3);
    return `${label}  ${formatCurrency(total)}`;
  });

  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  return ['📅 Last 7 days', '', ...dayLines, '', `Total: ${formatCurrency(total)}`].join('\n');
}

export function formatPeriodSummary(summary: PeriodSummary): string {
  return [
    '📊 Summary',
    '',
    `Income:   ${formatCurrency(summary.totalIncome)}`,
    `Expenses: ${formatCurrency(summary.totalExpense)}`,
    `Balance:  ${formatCurrency(summary.net)}`,
  ].join('\n');
}
