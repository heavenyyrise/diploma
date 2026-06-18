# Деплой: только Railway

Один проект Railway, три сервиса:

```text
Проект Railway
├── backend   (Django, root: backend/)
├── postgres  (Add Database)
└── frontend  (React static, root: frontend/)

Браузер → frontend.up.railway.app
              ↓ VITE_API_URL
         backend.up.railway.app/api
              ↓
         PostgreSQL + Volume /app/media
```

## 0. Подготовка

Закоммитьте и запушьте код в GitHub.

---

## 1. Backend (Django)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Сервис backend → **Settings → Source → Root Directory**: `backend`
3. **+ New → Database → PostgreSQL**
4. **Variables** (backend):

| Переменная | Значение |
|------------|----------|
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-backend.up.railway.app` (после Generate Domain) |
| `DB_HOST` | Reference → Postgres → `PGHOST` |
| `DB_PORT` | Reference → `PGPORT` |
| `DB_NAME` | Reference → `PGDATABASE` |
| `DB_USER` | Reference → `PGUSER` |
| `DB_PASSWORD` | Reference → `PGPASSWORD` |
| `FRONTEND_URL` | URL frontend (шаг 2, потом обновить) |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.up.railway.app` |
| `EMAIL_HOST_USER` | Gmail |
| `EMAIL_HOST_PASSWORD` | App Password |

5. **Volumes** → mount path `/app/media`
6. **Networking → Generate Domain** → скопируйте URL backend
7. Проверка: `https://your-backend.up.railway.app/admin/`

> Ошибка `Railpack could not determine how to build` → Root Directory = `backend`, Redeploy.
> Не держите `railway.toml` и `railway.json` в одной папке — Railway берёт `.toml` и может сломать сборку. Используйте только `railway.json`.

---

## 2. Frontend (React)

1. В том же проекте: **+ New → GitHub Repo** → тот же репозиторий
2. **Settings → Source → Root Directory**: `frontend`
3. **Variables** (важно: нужны на этапе **build**):

| Переменная | Значение |
|------------|----------|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` |

4. **Networking → Generate Domain** → URL frontend
5. Проверка: открывается страница `/login`

После получения URL frontend — обновите на **backend**:
- `FRONTEND_URL=https://your-frontend.up.railway.app`
- `CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app`

→ Redeploy backend.

---

## 3. Перенос локальных данных (опционально)

```powershell
pg_dump -U postgres -d freelancer_arm -F c -f backup.dump
pg_restore -h <PGHOST> -U <PGUSER> -d <PGDATABASE> --clean --if-exists backup.dump
```

Скопируйте `backend/media/` на Volume. **Вход**, не регистрация.

---

## 4. Проверка

- [ ] Логин на frontend URL
- [ ] Заказ + файл
- [ ] `/form?user_id=ВАШ_ID`
- [ ] Email (регистрация / отправка клиенту)

---

## 5. Обновления

```powershell
git push
```

Оба git-сервиса (backend + frontend) пересоберутся автоматически.

---

## Локальная разработка

Без `VITE_API_URL` — API через Vite proxy (`/api` → localhost:8000). См. README.
