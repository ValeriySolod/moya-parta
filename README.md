# Моя парта · Цифровий світ класу

Закритий цифровий клас для учнів **1–4** і їхнього **вчителя**.

> «У кожного є своя парта. У кожного є своє місце в класі.»

Один Next.js-додаток: сторінки й API разом (як на nmt.in.ua). Деплой — **Vercel**. База — **MySQL** на VPS.

```text
браузер → Next.js (Vercel: UI + /api) → MySQL `parta`
```

Прод: https://moya-parta.vercel.app

---

## Хто в продукті

| Роль | Статус |
|------|--------|
| **Учитель** | є — клас, код, завдання, тести, перевірка, події, чат, дошка |
| **Учень** | є — парта, клас, навчання, чат, перемоги |
| **Батьки** | немає кабінету — лише допомагають на вході |
| **School admin** | немає в MVP |

Пости зʼявляються одразу (учитель може приховати). Чат лише всередині свого класу.

---

## Структура

```text
/
├── src/app/           сторінки + Route Handlers `/api/*`
├── src/server/        Prisma, сервіси, JWT
├── src/components/    UI
├── prisma/            схема MySQL `parta`
├── public/
└── .env               JWT_SECRET + DATABASE_URL (не комітити)
```

Немає окремих папок `frontend/` і `backend/`. Немає окремого Express.

---

## Локально

```bash
cp .env.example .env
npm install
```

У `.env` підстав свої `JWT_SECRET` і `DATABASE_URL`.

Тунель до MySQL (не закривати):

```bash
ssh -p 443 -L 3307:127.0.0.1:3306 teamdeal@31.42.165.176
```

```bash
npm run dev
```

Сайт і API: http://localhost:3000  
Health: http://localhost:3000/api/health

Демо: `student@example.com` / `teacher@example.com` / пароль `demo1234` / код `3B-DEMO`.

---

## Vercel

Root Directory — корінь репо (не `frontend`).

| Змінна | Приклад |
|--------|---------|
| `JWT_SECRET` | довгий секрет |
| `DATABASE_URL` | `mysql://…` доступний з інтернету (не `127.0.0.1` VPS) |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_API_URL` не потрібен: клієнт ходить на `/api` того самого домену.

Канон продукту: [`.cursor/PROJECT_CHAIN.md`](./.cursor/PROJECT_CHAIN.md).
