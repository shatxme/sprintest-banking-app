export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function parseJson<T = any>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error('Некорректный JSON в теле запроса');
  }
}
