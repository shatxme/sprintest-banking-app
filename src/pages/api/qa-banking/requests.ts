import type { APIRoute } from 'astro';
import { createProductRequest, listProductRequests } from '@/data/qa-banking';
import { json, parseJson } from '@/lib/api';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const accountId = url.searchParams.get('accountId') ?? undefined;
  const data = listProductRequests(accountId || undefined);
  return json({ data });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseJson(request);

    // BUG: Missing validation for negative etaDays
    if (
      !body?.accountId ||
      (body?.productType !== 'card' && body?.productType !== 'account') ||
      typeof body?.productName !== 'string' ||
      body.productName.trim().length === 0 ||
      typeof body?.etaDays !== 'number' ||
      !Number.isFinite(body.etaDays)
    ) {
      return json({ error: 'Неверный формат запроса' }, { status: 400 });
    }

    // BUG: Math.max should prevent negative but this silently accepts 0
    const etaDays = Math.max(1, Math.round(body.etaDays));

    const requestRecord = createProductRequest({
      accountId: body.accountId,
      productType: body.productType,
      productName: body.productName,
      etaDays,
      note: typeof body.note === 'string' && body.note.trim().length > 0 ? body.note : undefined,
    });

    return json(
      {
        data: requestRecord,
        message: 'Заявка успешно отправлена',
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
