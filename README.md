# Sprintest Banking App

Тестовое банковское приложение с REST API и намеренными багами для практики QA.

## Что это?

Это mock-приложение банка, созданное специально для обучения тестированию ПО. Приложение содержит:

- **Веб-интерфейс** — современный UI для работы со счетами, картами, переводами
- **REST API** — полноценный API для тестирования через Postman, curl и т.д.
- **Намеренные баги** — ошибки в логике, валидации, отображении данных

## Установка

Требуется [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/shatxme/sprintest-banking-app.git
cd sprintest-banking-app
npm install
npm run dev
```

Откройте [http://localhost:4321](http://localhost:4321)

## REST API

API доступен по адресу `http://localhost:4321/api/qa-banking/`

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/qa-banking/accounts` | Список счетов |
| GET | `/api/qa-banking/accounts/{id}` | Информация о счёте |
| GET | `/api/qa-banking/accounts/{id}/transactions` | Транзакции по счёту |
| POST | `/api/qa-banking/transfers` | Создать перевод |
| POST | `/api/qa-banking/topups` | Пополнить счёт |
| GET | `/api/qa-banking/cards` | Список карт |
| GET | `/api/qa-banking/recipients` | Сохранённые получатели |
| GET | `/api/qa-banking/requests` | Заявки на продукты |
| POST | `/api/qa-banking/requests` | Создать заявку |

## Полный список багов

[qa-banking-bugs.md](qa-banking-bugs.md)

## Курс

Это приложение — часть курса [Sprintest](https://github.com/shatxme/sprintest).

## Лицензия

MIT — используйте свободно.
