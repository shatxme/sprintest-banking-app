import type { APIRoute } from 'astro';
import { listRecipients } from '@/data/qa-banking';
import { json } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async () => {
  const data = listRecipients();
  return json({
    data,
    meta: {
      total: data.length,
    },
  });
};
