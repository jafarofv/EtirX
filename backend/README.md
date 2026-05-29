# Backend Quick Start

## 1) Install

```bash
cd backend
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Migrate

```bash
python manage.py makemigrations
python manage.py migrate
```

## 3) Create admin user (optional)

```bash
python manage.py createsuperuser
```

## 4) Run

```bash
python manage.py runserver 8000
```

## 5) Seed demo data

```bash
python manage.py seed_data
```

## API Endpoints

- `GET /api/categories/`
- `GET /api/products/`
- `GET /api/products/{slug}/`
- `GET /api/products/?category={slug}`
- `GET /api/products/?q={query}`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/`
- `POST /api/auth/me/` (change password)
- `POST /api/auth/logout/`
- `POST /api/orders/`
- `GET /api/orders/{code}/`
- `GET /api/orders/{code}/tracking/`
- `GET /api/orders/my-orders/`
- `POST /api/contact/`

## Example order payload

```json
{
  "full_name": "Ali Aliyev",
  "phone": "+994501112233",
  "address": "Baku, Yasamal",
  "notes": "Call before delivery",
  "shipping_fee": "4.99",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```
