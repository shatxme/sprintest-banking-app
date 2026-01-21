import type { APIRoute } from 'astro';
import { listCards } from '@/data/qa-banking';
import { json } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const accountId = url.searchParams.get('accountId') ?? undefined;
  const data = listCards(accountId || undefined);
  return json({ data });
};
