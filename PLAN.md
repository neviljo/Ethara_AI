# Inventory & Order Management System — Build Plan

## Architecture Overview

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────┐
│   React Frontend │──────▶│  FastAPI Backend  │──────▶│  PostgreSQL  │
│   (Vercel/Netlify)│      │  (Render/Railway) │      │  (Managed DB)│
└─────────────────┘       └──────────────────┘       └──────────────┘
         │                          │
         └──────────────────────────┘
           Docker Compose (local/dev)
         + Docker Hub (backend image)
```

## Tech Stack
- **Frontend:** React (JavaScript) + Vite
- **Backend:** Python + FastAPI + SQLAlchemy + Pydantic
- **Database:** PostgreSQL
- **Package Manager (Python):** uv
- **Containerization:** Docker + Docker Compose

---

## Phase 1: Project Scaffolding [Step 1]

### 1.1 Backend Scaffold
- Create `backend/` directory
- Initialize Python project with `uv init`
- Create folder structure:
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py          # FastAPI app entry point
  │   ├── config.py        # Settings/ environment vars
  │   ├── database.py      # DB connection & session
  │   ├── models/          # SQLAlchemy models
  │   │   ├── __init__.py
  │   │   ├── product.py
  │   │   ├── customer.py
  │   │   └── order.py
  │   ├── schemas/         # Pydantic schemas
  │   │   ├── __init__.py
  │   │   ├── product.py
  │   │   ├── customer.py
  │   │   └── order.py
  │   ├── routers/         # API route handlers
  │   │   ├── __init__.py
  │   │   ├── products.py
  │   │   ├── customers.py
  │   │   └── orders.py
  │   └── services/        # Business logic
  │       ├── __init__.py
  │       ├── product_service.py
  │       ├── customer_service.py
  │       └── order_service.py
  ├── requirements.txt
  └── Dockerfile
  ```
- Dependencies: fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic, pydantic-settings, alembic (optional)

### 1.2 Frontend Scaffold
- Create `frontend/` directory
- Initialize React project: `npm create vite@latest`
- Install dependencies: axios, react-router-dom
- Folder structure:
  ```
  frontend/
  ├── src/
  │   ├── api/             # API client & endpoints
  │   ├── components/      # Reusable UI components
  │   ├── pages/           # Page components
  │   ├── context/         # State management
  │   ├── App.jsx
  │   └── main.jsx
  ├── Dockerfile
  └── .dockerignore
  ```

---

## Phase 2: Backend Implementation [Steps 2–5]

### Step 2: Database Models
- **Product:** id, name, sku (unique), price, quantity_in_stock, created_at, updated_at
- **Customer:** id, full_name, email (unique), phone, created_at
- **Order:** id, customer_id (FK), total_amount, status, created_at
- **OrderItem:** id, order_id (FK), product_id (FK), quantity, unit_price

### Step 3: Pydantic Schemas
- Request/Response schemas for all entities
- Validation: email format, positive price, non-negative stock, etc.

### Step 4: Business Logic (Services)
- **SKU uniqueness** — enforce at DB level + application level
- **Email uniqueness** — same approach
- **Stock validation** — reject order if insufficient
- **Auto stock reduction** — decrement quantity on order creation
- **Auto total calculation** — sum(quantity * unit_price) for items
- **Error handling** — custom exceptions → proper HTTP codes

### Step 5: API Routes
- Full CRUD for products, customers, orders
- Input validation via Pydantic
- Proper HTTP status codes (201, 200, 204, 400, 404, 409)
- CORS middleware configuration

---

## Phase 3: Frontend Implementation [Steps 6–7]

### Step 6: Core Pages & Routing
- **Dashboard** — summary cards (total products, customers, orders, low stock)
- **Products** — list, add form, edit form, delete
- **Customers** — list, add form, delete
- **Orders** — list, create form (select customer + products with quantities), detail view

### Step 7: State Management & API Layer
- Axios instance with base URL from env
- API service modules per entity
- React Context for global state (optional — local state may suffice)

### UI/UX
- Responsive CSS (plain CSS or a lightweight framework)
- Form validation (required fields, email format, positive numbers)
- Success/error toast messages
- Clean, professional layout

---

## Phase 4: Docker Configuration [Step 8]

### Backend Dockerfile
- Base: `python:3.12-slim`
- Install uv, copy requirements, install deps
- Copy app code, expose port 8000
- `CMD uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend Dockerfile
- Stage 1 (build): `node:20-alpine` → `npm run build`
- Stage 2 (serve): `nginx:alpine` → copy build output
- Expose port 80

### Docker Compose
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes: postgres_data:/var/lib/postgresql/data
    env: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

  backend:
    build: ./backend
    depends_on: db
    env: DATABASE_URL
    ports: 8000:8000

  frontend:
    build: ./frontend
    depends_on: backend
    ports: 3000:80
```

### .dockerignore
- node_modules, __pycache__, .git, .env, etc.

---

## Phase 5: Deployment [Steps 9–10]

### Backend (Render)
- Push Docker image to Docker Hub
- Set up Render Web Service using Docker
- Configure environment variables (DATABASE_URL, CORS origins)
- Need managed PostgreSQL (Render provides free tier)

### Frontend (Vercel)
- Connect GitHub repo
- Set build command: `npm run build`
- Set output directory: `dist`
- Configure env var: `VITE_API_URL` → deployed backend URL

---

## Step-by-Step Execution Order

| Step | Task | Details |
|------|------|---------|
| 1 | Scaffold backend + frontend | Create project structure, install deps |
| 2 | Database models | SQLAlchemy models for Product, Customer, Order, OrderItem |
| 3 | Pydantic schemas | Request/response validation schemas |
| 4 | Business logic services | SKU/email uniqueness, stock mgmt, auto calc |
| 5 | API routes | Full CRUD endpoints with error handling |
| 6 | Frontend — Dashboard + Products | Summary + CRUD UI |
| 7 | Frontend — Customers + Orders | CRUD UI with order creation logic |
| 8 | Docker config | Dockerfiles, docker-compose, .dockerignore |
| 9 | Push to GitHub | Create repo, push code |
| 10 | Deploy | Backend on Render, Frontend on Vercel, Docker Hub |

---

## Business Rules Checklist
- [x] Product SKU must be unique
- [x] Customer email must be unique
- [x] Product quantity cannot be negative
- [x] Cannot order if inventory insufficient
- [x] Creating order auto-reduces stock
- [x] Total amount auto-calculated by backend
- [x] All APIs have proper error handling
- [x] Appropriate HTTP status codes
- [x] Request data validation before processing

---

## Environment Variables

### Backend
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
CORS_ORIGINS=http://localhost:3000,https://frontend.vercel.app
```

### Frontend
```
VITE_API_URL=https://backend.onrender.com
```

### PostgreSQL
```
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=inventory_db
```

---

## Notes
- Testing in GitHub Codespaces for Docker — user's local machine is not strong enough
- Using `uv` for Python package management (fast, modern)
- No TypeScript requirement — plain JavaScript for React
- Lightweight base images (slim/alpine) for production
- Named volumes for PostgreSQL data persistence
