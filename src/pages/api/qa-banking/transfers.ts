import type { APIRoute } from 'astro';
import { createTransfer } from '@/data/qa-banking';
import { json, parseJson } from '@/lib/api';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseJson(request);

    // BUG: Missing validation for negative amounts and zero
    if (
      !body?.fromAccountId ||
      !body?.toAccountNumber ||
      typeof body?.amount !== 'number' ||
      !Number.isFinite(body.amount)
    ) {
      return json({ error: 'Неверный формат запроса' }, { status: 400 });
    }

    const result = createTransfer({
      fromAccountId: body.fromAccountId,
      toAccountNumber: body.toAccountNumber,
      amount: body.amount,
      description: body.description,
    });

    return json(
      {
        data: result,
        message: 'Перевод успешно создан',
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
