# Деплой: Vercel + Railway

## Схема

```text
Браузер → Vercel (React)
              ├─ /api/*   → Railway (Django)
              └─ /*       → index.html

Railway: Django + PostgreSQL + Volume /app/media
```

## 1. Railway (backend)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. **Root Directory**: `backend`
3. **+ New → Database → PostgreSQL**
4. Backend → **Variables** — добавить:

| Переменная | Значение |
|------------|----------|
| `SECRET_KEY` | Случайная длинная строка |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.up.railway.app` |
| `DB_HOST` | `${{Postgres.PGHOST}}` (Reference) |
| `DB_PORT` | `${{Postgres.PGPORT}}` |
| `DB_NAME` | `${{Postgres.PGDATABASE}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `FRONTEND_URL` | URL Vercel (после шага 2) |
| `EMAIL_HOST_USER` | Gmail |
| `EMAIL_HOST_PASSWORD` | App Password |

5. **Volumes** → mount `/app/media`
6. **Networking** → Generate Domain
7. Проверка: `https://your-app.up.railway.app/admin/` (502 до первого успешного деплоя — норм)

## 2. Vercel (frontend)

1. [vercel.com](https://vercel.com) → Import Git Repository.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variable**:

```text
BACKEND_URL=https://your-app.up.railway.app
```

6. Deploy → скопировать URL (`https://your-app.vercel.app`)

## 3. Связать сервисы

В Railway обновить `FRONTEND_URL=https://your-app.vercel.app` → Redeploy.

## 4. Перенос локальных данных (опционально)

```powershell
pg_dump -U postgres -d freelancer_arm -F c -f backup.dump
pg_restore -h <PGHOST> -U <PGUSER> -d <PGDATABASE> --clean --if-exists backup.dump
```

Скопировать `backend/media/` на Railway Volume. Вход — тем же email/паролем, не регистрация.

## 5. Проверка

- [ ] Логин / регистрация + email
- [ ] Заказы + загрузка файла
- [ ] Публичная форма `/form`
- [ ] Отправка письма клиенту

## Обновления

```powershell
git add .
git commit -m "описание"
git push
```

Railway и Vercel пересоберут автоматически.
