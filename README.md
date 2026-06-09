# ƏtirX — Premium Parfüm Mağazası

**ƏtirX** müasir full-stack e-ticarət platformasıdır — premium parfümlərin satışı üçün nəzərdə tutulmuş, Django REST Framework + React ilə qurulmuş veb tətbiq.

---

## 📸 Texnologiyalar

| Qat | Texnologiya |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, MUI |
| **Backend** | Django 4.2+, Django REST Framework, Celery, Daphne (ASGI) |
| **Database** | PostgreSQL 16 (production) / SQLite (development) |
| **Cache** | Redis 7 |
| **Real-time** | Django Channels + WebSocket |
| **Deployment** | Docker Compose, Gunicorn, Nginx, WhiteNoise |
| **Notifications** | Email (SMTP), WhatsApp (Twilio — optional) |

---

## 🚀 Tez Başlanğıc (Development)

### 1) Reponu klonlayın

```bash
git clone https://github.com/jafarofv/EtirX.git
cd EtirX
```

### 2) Backend-i qurun

```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env         # macOS/Linux

# Virtual mühit yaradın
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data     # Demo məhsulları əlavə edin
python manage.py createsuperuser
python manage.py runserver 8000
```

### 3) Frontend-i qurun

```bash
cd ..                         # Repo root-a qayıdın
npm install
npm run dev                   # http://localhost:5173
```

### 4) .env faylı (backend/.env)

```env
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=change-me-to-a-random-50-char-string
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DJANGO_CSRF_TRUSTED_ORIGINS=https://etirx.az
REDIS_URL=redis://127.0.0.1:6379/0
```

> **Qeyd:** Redis mövcud deyilsə, backend avtomatik olaraq `LocMemCache`-ə keçir — development üçün tam işləkdir.

---

## 🐳 Docker ilə Production Qurulumu

```bash
docker compose up -d --build
```

Bu komanda 4 servisi işə salır:
- **PostgreSQL 16** — database
- **Redis 7** — cache + WebSocket
- **Backend** — Daphne ASGI server (`:8000`)
- **Frontend** — Nginx ilə static fayllar (`:80`)

---

## 📡 API Endpointlər

| Endpoint | Metod | Açıqlama |
|---|---|---|
| `GET /api/products/` | GET | Məhsul siyahısı (paginasiya + filter) |
| `GET /api/products/{slug}/` | GET | Məhsul detalları |
| `GET /api/categories/` | GET | Kateqoriyalar |
| `POST /api/auth/register/` | POST | Qeydiyyat |
| `POST /api/auth/login/` | POST | Giriş (`Token` qaytarır) |
| `GET/PATCH /api/auth/me/` | GET/PATCH | Profil məlumatları |
| `POST /api/orders/` | POST | Sifariş yarat |
| `GET /api/orders/{code}/` | GET | Sifariş detalları (sahib üçün) |
| `GET /api/orders/{code}/tracking/` | GET | Sifariş statusu (açıq) |
| `GET /api/promo-codes/` | GET | Aktiv promokodlar |
| `POST /api/promo-codes/validate/` | POST | Promokod yoxla |
| `GET /api/delivery-methods/` | GET | Çatdırılma üsulları |
| `GET /api/testimonials/` | GET | Müştəri rəyləri |
| `GET /api/site-settings/` | GET | Sayt parametrləri |
| `POST /api/contact/` | POST | Əlaqə formu |

---

## 🛠 Scriptlər

| Əmr | Açıqlama |
|---|---|
| `npm run dev` | Frontend dev server |
| `npm run build` | Frontend production build |
| `npm run typecheck` | TypeScript tip yoxlaması |
| `python manage.py test` | Backend testləri |
| `python manage.py seed_data` | Demo data yüklə |
| `python manage.py createsuperuser` | Admin yarat |

---

## 🏗 Layihə Strukturu

```
EtirX/
├── backend/
│   ├── config/          # Django settings, Celery, ASGI, Redis
│   ├── shop/            # Models, views, serializers, consumers
│   ├── media/           # Uploaded product images
│   ├── manage.py
│   └── requirements.txt
├── src/
│   ├── app/
│   │   ├── components/  # UI komponentlər (Layout, ErrorBoundary, SEO)
│   │   ├── screens/     # Səhifə komponentləri
│   │   ├── lib/         # API client, auth, storage, utilities
│   │   ├── i18n.tsx     # Tərcümə (az/en/ru)
│   │   └── routes.tsx   # Frontend routing
│   └── main.tsx
├── public/              # Statik fayllar (logo, favicon, manifest)
├── nginx/               # Nginx konfiqurasiyası (production)
├── docker-compose.yml
├── Dockerfile.frontend
└── vite.config.ts
```

---

## 🌐 Dəstəklənən Dillər

- 🇦🇿 Azərbaycan (default)
- 🇬🇧 English
- 🇷🇺 Русский

---

## 📄 Lisenziya

Bu layihə [MIT License](LICENSE) ilə qorunur.

---

**Hazırlayan:** [jafarofv](https://github.com/jafarofv)
