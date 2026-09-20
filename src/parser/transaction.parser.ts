import type { ParsedTransaction } from '../types/api.js';

const TRANSACTION_PATTERN = /^(\d+(?:[.,]\d{1,2})?)\s+(.+)$/;

export function parseTransaction(text: string): ParsedTransaction | null {
  const trimmed = text.trim();
  const match = TRANSACTION_PATTERN.exec(trimmed);
  if (!match) return null;

  const rawAmount = match[1].replace(',', '.');
  const amount = Number(rawAmount);
  const description = match[2].trim();

  if (!Number.isFinite(amount) || amount <= 0 || !description) {
    return null;
  }

  return {
    amount,
    description,
    type: 'expense',
  };
}
