import type { APIRoute } from 'astro';
import { getAccount } from '@/data/qa-banking';
import { json } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params as { id: string };
  const account = id ? getAccount(id) : undefined;

  // BUG: Returns 404 but doesn't sanitize/validate the id parameter
  if (!account) {
    return json({ error: 'Счет не найден' }, { status: 404 });
  }

  return json({ data: account });
};
