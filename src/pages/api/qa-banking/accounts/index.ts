import type { APIRoute } from 'astro';
import { listAccounts } from '@/data/qa-banking';
import { json } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async () => {
  const accounts = listAccounts();

  return json({
    data: accounts,
    meta: {
      total: accounts.length,
      currencySummary: accounts.reduce<Record<string, number>>((acc, account) => {
        acc[account.currency] = (acc[account.currency] || 0) + account.balance;
        return acc;
      }, {}),
    },
  });
};
