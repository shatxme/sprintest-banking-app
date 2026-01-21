import type { APIRoute } from 'astro';
import { createTopUp } from '@/data/qa-banking';
import { json, parseJson } from '@/lib/api';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseJson(request);

    // BUG: API accepts negative amounts but data layer rejects them
    if (!body?.accountId || typeof body?.amount !== 'number' || !Number.isFinite(body.amount)) {
      return json({ error: 'Неверный формат запроса' }, { status: 400 });
    }

    const topUp = createTopUp({
      accountId: body.accountId,
      amount: body.amount,
      description: body.description,
    });

    return json(
      {
        data: topUp,
        message: 'Пополнение успешно выполнено',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 });
    }
    return json({ error: 'Неизвестная ошибка' }, { status: 500 });
  }
};
