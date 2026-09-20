import type { Bot } from 'grammy';
import {
  ApiClientError,
  getRecentTransactions,
  getSummary,
  getTodayTransactions,
  shiftDate,
  todayLocal,
} from '../api/client.js';
import {
  formatApiError,
  formatHelp,
  formatPeriodSummary,
  formatTodayList,
  formatWeekSummary,
} from '../formatters/transaction.formatter.js';
import type { ApiErrorKind } from '../types/api.js';

function errorKind(err: unknown): ApiErrorKind {
  if (err instanceof ApiClientError) return err.kind;
  return 'http';
}

function logError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${context}] ${message}`);
}

export function registerCommands(bot: Bot): void {
  bot.command('start', async (ctx) => {
    await ctx.reply(formatHelp());
  });

  bot.command('today', async (ctx) => {
    try {
      const transactions = await getTodayTransactions();
      await ctx.reply(formatTodayList(transactions));
    } catch (err) {
      logError('today', err);
      await ctx.reply(formatApiError(errorKind(err)));
    }
  });

  bot.command('week', async (ctx) => {
    try {
      const to = todayLocal();
      const from = shiftDate(to, -6);
      const transactions = await getRecentTransactions(7);
      await ctx.reply(formatWeekSummary(transactions, from, to));
    } catch (err) {
      logError('week', err);
      await ctx.reply(formatApiError(errorKind(err)));
    }
  });

  bot.command('summary', async (ctx) => {
    try {
      const summary = await getSummary();
      await ctx.reply(formatPeriodSummary(summary));
    } catch (err) {
      logError('summary', err);
      await ctx.reply(formatApiError(errorKind(err)));
    }
  });
}
