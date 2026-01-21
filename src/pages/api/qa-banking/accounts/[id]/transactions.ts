import type { APIRoute } from 'astro';
import { getAccount, listTransactions } from '@/data/qa-banking';
import { json } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params as { id: string };
  const account = id ? getAccount(id) : undefined;

  if (!account) {
    return json({ error: 'Счет не найден' }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit');
  const size = limit ? Math.max(1, Math.min(50, Number(limit))) : undefined;

  const accountTransactions = listTransactions(id);
  const data = size ? accountTransactions.slice(0, size) : accountTransactions;

  return json({
    data,
    meta: {
      total: accountTransactions.length,
      currency: account.currency,
      accountNumber: account.accountNumber,
    },
  });
};
