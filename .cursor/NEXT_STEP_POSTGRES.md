# Наступний крок після Prisma

> Канон: [PROJECT_CHAIN.md](./PROJECT_CHAIN.md)  
> Архітектура: один Next.js (UI + `/api`) на Vercel, MySQL на VPS.

## Зроблено

- Усі сервіси на Prisma MySQL
- Один додаток замість `frontend/` + `backend/` + Express
- Health: `/api/health`

## Далі

- IDOR: class-scoped checks на learning / event / post
- Vercel env: `JWT_SECRET`, `DATABASE_URL` (не localhost VPS)
- E2E: вчитель → клас → учень → пост → чат → завдання
