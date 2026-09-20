import type { Bot } from 'grammy';
import { ApiClientError, createTransaction } from '../api/client.js';
import {
  formatApiError,
  formatCreated,
  formatMalformedInput,
} from '../formatters/transaction.formatter.js';
import { parseTransaction } from '../parser/transaction.parser.js';
import type { ApiErrorKind } from '../types/api.js';

function errorKind(err: unknown): ApiErrorKind {
  if (err instanceof ApiClientError) return err.kind;
  return 'http';
}

export function registerMessages(bot: Bot): void {
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;

    // Commands are handled separately.
    if (text.startsWith('/')) return;

    const parsed = parseTransaction(text);
    if (!parsed) {
      await ctx.reply(formatMalformedInput());
      return;
    }

    try {
      await createTransaction(parsed);
      await ctx.reply(formatCreated(parsed.amount, parsed.description));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[create] ${message}`);
      await ctx.reply(formatApiError(errorKind(err)));
    }
  });
}
