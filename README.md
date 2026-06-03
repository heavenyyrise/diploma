# Веб CRM фрилансера

Веб-приложение для учета клиентов, заказов, услуг, заявок и доходов фрилансера. Проект состоит из backend на Django REST Framework и frontend на React/Vite.

## Возможности

- регистрация, авторизация и подтверждение email;
- учет клиентов, источников клиентов и контактных данных;
- управление услугами и заказами;
- статусы заказов, история изменений и вложения к заказам;
- публичная форма заявки для потенциальных клиентов;
- обработка лидов: принятие, отклонение и перевод в работу;
- аналитика по доходам, услугам, клиентам и источникам заявок;
- email-шаблоны, отправка писем и история отправок;
- Swagger-документация API.

## Стек

**Backend**

- Python
- Django 5
- Django REST Framework
- Simple JWT
- PostgreSQL
- drf-spectacular
- django-filter
- django-cors-headers

**Frontend**

- React 18
- Vite
- React Router
- Axios
- Recharts
- date-fns

## Структура проекта

```text
backend/        Django API, модели, миграции и настройки проекта
frontend/       React-приложение
```

Основные backend-модули:

- `users` - пользователи, JWT-авторизация, подтверждение email;
- `clients` - клиенты, источники и контактные данные;
- `services` - услуги фрилансера;
- `orders` - заказы, вложения и история изменений;
- `leads` - заявки из публичной формы;
- `form_settings` - настройки публичной формы;
- `analytics` - аналитика;
- `messaging` - email-шаблоны и отправленные письма.

## Требования

- Python 3.11+
- Node.js 18+
- PostgreSQL
- npm

## Настройка backend

Перейдите в папку backend:

```powershell
cd backend
```

Создайте и активируйте виртуальное окружение:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Установите зависимости:

```powershell
pip install -r requirements.txt
```

Создайте файл `.env` на основе примера:

```powershell
Copy-Item .env.example .env
```

Пример переменных окружения:

```env
SECRET_KEY=django-insecure-замени-на-свой-ключ
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=freelancer_arm
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

EMAIL_HOST_USER=freelancerarm@gmail.com
EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx
DEFAULT_FROM_EMAIL=Freelancer ARM <freelancerarm@gmail.com>
FRONTEND_URL=http://localhost:5173
```

Создайте базу данных PostgreSQL с именем из `DB_NAME`, затем примените миграции:

```powershell
python manage.py migrate
```

При необходимости создайте администратора:

```powershell
python manage.py createsuperuser
```

Запустите backend:

```powershell
python manage.py runserver
```

Backend будет доступен по адресу:

```text
http://localhost:8000
```

Документация API:

```text
http://localhost:8000/api/docs/
```

Админ-панель Django:

```text
http://localhost:8000/admin/
```

## Настройка frontend

В новом терминале перейдите в папку frontend:

```powershell
cd frontend
```

Установите зависимости:

```powershell
npm install
```

Запустите frontend:

```powershell
npm run dev
```

Frontend будет доступен по адресу:

```text
http://localhost:5173
```

Vite проксирует запросы `/api` на backend:

```text
http://localhost:8000
```

## Основные маршруты frontend

- `/login` - вход;
- `/register` - регистрация;
- `/verify-email` - подтверждение email;
- `/` - дашборд;
- `/orders` - заказы;
- `/clients` - клиенты;
- `/services` - услуги;
- `/income` - доходы и аналитика;
- `/email` - email-шаблоны и отправка писем;
- `/leads` - заявки;
- `/form-settings` - настройки публичной формы;
- `/form` - публичная форма заявки.

## Основные API-разделы

- `/api/auth/` - авторизация и пользователи;
- `/api/clients/` - клиенты и справочники;
- `/api/services/` - услуги;
- `/api/orders/` - заказы;
- `/api/analytics/` - аналитика;
- `/api/leads/` - заявки;
- `/api/form-settings/` - настройки публичной формы;
- `/api/messaging/` - email-шаблоны и отправка писем.

## Сборка frontend

```powershell
cd frontend
npm run build
```

Для локального просмотра production-сборки:

```powershell
npm run preview
```

## Примечания

- Для работы email-отправки через Gmail нужен App Password, обычный пароль от аккаунта не подойдет.
- Перед запуском backend убедитесь, что PostgreSQL запущен и база данных создана.
- Значение `FRONTEND_URL` используется для ссылок подтверждения email и должно совпадать с адресом frontend.
- В режиме разработки frontend обращается к API через proxy Vite, поэтому backend и frontend нужно запускать одновременно.
