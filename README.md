# Inventory & Order Management System

A production-ready, containerized full-stack application for managing products, customers, and orders with real-time inventory tracking.

![Tech Stack](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi)
![Tech Stack](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Deployed](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black)
![Deployed](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [High-Level Design (HLD)](#high-level-design-hld)
- [Low-Level Design (LLD)](#low-level-design-lld)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Submission Deliverables](#submission-deliverables)

---

## System Architecture

```
                    ┌──────────────────────────────────────┐
                    │           React Frontend              │
                    │   Dashboard │ Products │ Customers    │
                    │   Orders    │   (Vercel)              │
                    └──────────────┬───────────────────────┘
                                   │  /api/* (axios)
                    ┌──────────────▼───────────────────────┐
                    │        Nginx Reverse Proxy            │
                    │   /api/*  →  backend:8000             │
                    │   /*       →  index.html (SPA)        │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │         FastAPI Backend               │
                    │   Routers  →  Services  →  Models    │
                    │   (HTTP)      (Logic)     (ORM)       │
                    │   (Render / Docker)                   │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │          PostgreSQL 16                │
                    │   Products │ Customers │ Orders       │
                    │   OrderItems (Named Volume)           │
                    └──────────────────────────────────────┘
```

### Container Topology

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Compose Network                  │
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌───────────────┐  │
│  │  Frontend   │   │   Backend   │   │  PostgreSQL   │  │
│  │  nginx:alpine│──▶│python:3.12 │──▶│  16-alpine    │  │
│  │  Port 3000   │   │  Port 8000  │   │  Port 5432    │  │
│  └─────────────┘   └─────────────┘   └───────────────┘  │
│                          │                    │          │
│                     Docker Hub           Named Volume    │
│                 neviljo/inventory-    postgres_data      │
│                 backend:latest                           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → axios API Call
  → Nginx (/api/ prefix rewrite)
  → FastAPI Router (parse request, validate)
  → Service Layer (business logic, validation)
  → SQLAlchemy Model (ORM query)
  → PostgreSQL (execute SQL)
  → Response JSON → UI Update
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | UI framework and build tool |
| **Backend** | Python 3.12 + FastAPI | REST API framework |
| **ORM** | SQLAlchemy 2.0 | Database ORM and relationships |
| **Validation** | Pydantic v2 | Request/response data validation |
| **Database** | PostgreSQL 16 | Relational database |
| **Containerization** | Docker + Docker Compose | Service orchestration |
| **Reverse Proxy** | Nginx (alpine) | Frontend serving and API proxy |
| **Deployment** | Render (backend), Vercel (frontend) | Free hosting platforms |
| **Version Control** | Git + GitHub | Source code management |

---

## High-Level Design (HLD)

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI ROUTER (HTTP Layer)                 │
│                                                             │
│  Responsibilities:                                          │
│  - Parse and validate incoming HTTP requests                │
│  - Call appropriate service method                          │
│  - Format HTTP response with correct status code            │
│  - Catch service exceptions → HTTPException                 │
│                                                             │
│  Files: routers/products.py, customers.py, orders.py        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  SERVICE (Business Logic Layer)               │
│                                                             │
│  Responsibilities:                                          │
│  - Enforce uniqueness (SKU, email)                          │
│  - Validate stock availability                              │
│  - Auto-reduce stock on order creation                      │
│  - Auto-calculate order total                               │
│  - Restore stock on order cancellation                      │
│  - Check for existing references before delete              │
│                                                             │
│  Files: services/product_service.py, customer_service.py,   │
│         order_service.py                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  MODEL (Data Access Layer)                   │
│                                                             │
│  Responsibilities:                                          │
│  - SQLAlchemy ORM class definitions                         │
│  - Database constraints (UNIQUE, CHECK, FK)                 │
│  - Relationships and back-populates                         │
│  - Indexes for query performance                            │
│                                                             │
│  Files: models/product.py, customer.py, order.py            │
└─────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
1. Browser navigates to /products
2. React Router renders Products.jsx
3. Component mounts → calls api/products.js → axios GET /api/products
4. Nginx receives request → matches /api/ prefix
5. Nginx rewrites to /products and proxies to backend:8000
6. FastAPI router matches GET /products
7. Router calls ProductService(db).get_all()
8. Service queries SQLAlchemy: Product.query.all()
9. SQLAlchemy executes: SELECT * FROM products
10. PostgreSQL returns rows
11. Response flows back: Service → Router → Nginx → Browser
12. React updates UI with product list
```

---

## Low-Level Design (LLD)

### Entity Relationship Diagram (ERD)

```
┌──────────────────┐       ┌──────────────────┐
│     Product      │       │    Customer      │
├──────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)         │
│ public_id (UK)  │       │ public_id (UK)  │
│ name            │       │ full_name       │
│ sku (UK)        │       │ email (UK)      │
│ price           │       │ phone           │
│ quantity_in_stock│      │ created_at      │
│ created_at      │       └────────┬─────────┘
│ updated_at      │                │
└────────┬────────┘                │ 1
         │ 1                      │
         │                        │
         │ *             ┌────────▼─────────┐
         │               │      Order       │
         │               ├──────────────────┤
         └───────────────│ id (PK)         │
                         │ public_id (UK)  │
            ┌────────────│ customer_id (FK)│
            │            │ total_amount    │
            │            │ status          │
            │            │ created_at      │
            │            └────────┬─────────┘
            │ *                   │ 1
            │                     │
      ┌─────▼──────────┐         │
      │   OrderItem    │         │
      ├────────────────┤         │
      │ id (PK)       │         │
      │ order_id (FK) │─────────┘
      │ product_id (FK)│
      │ quantity       │
      │ unit_price     │
      └────────────────┘
```

### Database Schema

#### Products

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| public_id | VARCHAR(36) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| sku | VARCHAR(100) | UNIQUE, NOT NULL, INDEXED |
| price | NUMERIC(10,2) | NOT NULL, CHECK (price >= 0) |
| quantity_in_stock | INTEGER | NOT NULL, DEFAULT 0, CHECK (quantity >= 0) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

#### Customers

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| public_id | VARCHAR(36) | UNIQUE, NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED |
| phone | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

#### Orders

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| public_id | VARCHAR(36) | UNIQUE, NOT NULL |
| customer_id | INTEGER | NOT NULL, FK → customers(id), ON DELETE RESTRICT |
| total_amount | NUMERIC(10,2) | NOT NULL, DEFAULT 0 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

#### Order Items

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| order_id | INTEGER | NOT NULL, FK → orders(id), ON DELETE CASCADE |
| product_id | INTEGER | NOT NULL, FK → products(id), ON DELETE RESTRICT |
| quantity | INTEGER | NOT NULL, CHECK (quantity > 0) |
| unit_price | NUMERIC(10,2) | NOT NULL |

### API Route Map

| Method | Endpoint | Success Status | Error Statuses | Description |
|--------|----------|---------------|----------------|-------------|
| POST | `/products` | 201 Created | 409 Conflict | Create a new product |
| GET | `/products` | 200 OK | — | Retrieve all products |
| GET | `/products/{id}` | 200 OK | 404 Not Found | Retrieve product by ID |
| PUT | `/products/{id}` | 200 OK | 404, 409 | Update product details |
| DELETE | `/products/{id}` | 204 No Content | 404, 409 | Delete a product |
| POST | `/customers` | 201 Created | 409 Conflict | Create a new customer |
| GET | `/customers` | 200 OK | — | Retrieve all customers |
| GET | `/customers/{id}` | 200 OK | 404 Not Found | Retrieve customer by ID |
| DELETE | `/customers/{id}` | 204 No Content | 404, 409 | Delete a customer |
| POST | `/orders` | 201 Created | 400, 404 | Create a new order |
| GET | `/orders` | 200 OK | — | Retrieve all orders |
| GET | `/orders/{id}` | 200 OK | 404 Not Found | Retrieve order by ID |
| DELETE | `/orders/{id}` | 204 No Content | 404 | Cancel/delete an order |
| GET | `/health` | 200 OK | — | Health check endpoint |

### Business Logic Rules

| Rule | Implementation | Enforcement Location |
|------|---------------|---------------------|
| Product SKU must be unique | DB UNIQUE constraint + app-level check | `models/product.py:16`, `services/product_service.py:12` |
| Customer email must be unique | DB UNIQUE constraint + app-level check | `models/customer.py:15`, `services/customer_service.py:12` |
| Product quantity cannot be negative | DB CHECK constraint + Pydantic validation | `models/product.py:26`, `schemas/product.py:12` |
| Insufficient stock rejection | Quantity check before order item creation | `services/order_service.py:34-36` |
| Auto stock reduction on order | Decrement quantity_in_stock atomically | `services/order_service.py:39` |
| Auto total amount calculation | Sum of (quantity × unit_price) across items | `services/order_service.py:44` |
| Stock restoration on cancel | Increment quantity_in_stock on order delete | `services/order_service.py:62-65` |
| Referential integrity | Foreign key constraints with ON DELETE rules | `models/order.py:14,32-33` |

### Error Handling Strategy

| Scenario | HTTP Status | Response Example |
|----------|-------------|------------------|
| Resource not found | 404 Not Found | `{"detail": "Product 99 not found"}` |
| Duplicate SKU | 409 Conflict | `{"detail": "Product with SKU 'XYZ' already exists"}` |
| Duplicate email | 409 Conflict | `{"detail": "Customer with email 'x@y.com' already exists"}` |
| Insufficient stock | 400 Bad Request | `{"detail": "Insufficient stock for product 'X': requested 20, available 5"}` |
| Delete referenced product | 409 Conflict | `{"detail": "Cannot delete product: it is referenced in existing orders"}` |
| Delete customer with orders | 409 Conflict | `{"detail": "Cannot delete customer: they have existing orders"}` |
| Invalid input | 422 Unprocessable | Pydantic field validation errors |

---

## Features

### Product Management
- **Add** products with name, SKU, price, and stock quantity
- **View** all products in a sortable table with low-stock highlighting (< 10 units)
- **Update** product details inline via edit form
- **Delete** products safely — blocked with error message if referenced in orders
- Server-side validation prevents negative prices and stock

### Customer Management
- **Add** customers with name, email (validated format), and phone
- **View** customer list in a clean table
- **Delete** customers safely — blocked with error message if they have existing orders
- Email uniqueness enforced at database and application level

### Order Management
- **Create** orders with multi-item support — select customer, add products with quantities
- **Auto-calculates** total amount from item quantities and current product prices
- **Auto-reduces** inventory when order is placed
- **View** orders list with customer name, item count, total, and status
- **View details** in a modal with per-item breakdown (product, qty, unit price, subtotal)
- **Cancel** orders — restores stock automatically
- Rejects orders with insufficient inventory

### Dashboard
- **Total Products** — count of all products in the system
- **Total Customers** — count of registered customers
- **Total Orders** — count of all orders placed
- **Low Stock Items** — products with quantity below 10 units
- All stats update in real-time on page load

### UI/UX
- Responsive design for desktop and mobile (media queries)
- Clean, professional interface with consistent card-based layout
- Form validation with required fields and type checks
- Success/error alerts for all operations
- Modal for order detail view
- Status badges and stock level indicators

---

## Project Structure

```
inventory-management/
│
├── backend/                            # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py                # App entry point
│   │   ├── main.py                    # FastAPI app, CORS, lifespan
│   │   ├── config.py                  # Pydantic Settings (env vars)
│   │   ├── database.py                # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   ├── __init__.py            # Model exports
│   │   │   ├── product.py            # Product ORM model
│   │   │   ├── customer.py           # Customer ORM model
│   │   │   └── order.py              # Order + OrderItem ORM models
│   │   ├── schemas/
│   │   │   ├── __init__.py            # Schema exports
│   │   │   ├── product.py            # Pydantic product schemas
│   │   │   ├── customer.py           # Pydantic customer schemas
│   │   │   └── order.py              # Pydantic order schemas
│   │   ├── routers/
│   │   │   ├── __init__.py            # Router exports
│   │   │   ├── products.py           # Product CRUD endpoints
│   │   │   ├── customers.py          # Customer CRUD endpoints
│   │   │   └── orders.py             # Order management endpoints
│   │   └── services/
│   │       ├── __init__.py            # Service exports
│   │       ├── product_service.py    # Product business logic
│   │       ├── customer_service.py   # Customer business logic
│   │       └── order_service.py      # Order business logic
│   ├── Dockerfile                     # Production Docker image
│   ├── pyproject.toml                 # Python dependencies
│   ├── uv.lock                        # Lockfile for reproducibility
│   └── .dockerignore
│
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js             # Axios instance (base URL)
│   │   │   ├── products.js           # Product API calls
│   │   │   ├── customers.js          # Customer API calls
│   │   │   └── orders.js             # Order API calls
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Navigation bar
│   │   │   └── Layout.jsx            # Page layout wrapper
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Summary dashboard
│   │   │   ├── Products.jsx          # Product CRUD page
│   │   │   ├── Customers.jsx         # Customer CRUD page
│   │   │   └── Orders.jsx            # Order management page
│   │   ├── App.jsx                   # Router setup
│   │   ├── App.css                   # Application styles
│   │   ├── index.css                 # Base reset styles
│   │   └── main.jsx                  # React entry point
│   ├── Dockerfile                     # Multi-stage Docker build
│   ├── nginx.conf                     # Nginx proxy configuration
│   ├── vite.config.js                 # Vite config with dev proxy
│   ├── package.json
│   └── .dockerignore
│
├── docker-compose.yml                 # Service orchestration
├── .env.example                       # Environment variable template
├── .gitignore
├── PLAN.md                            # Development plan
└── README.md
```

---

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 20+ and Python 3.12+ (for local development)

### Run with Docker (Production Mode)

```bash
# Clone the repository
git clone https://github.com/neviljo/Ethara_AI.git
cd Ethara_AI

# Start all services
docker compose up --build

# Access the application
Frontend: http://localhost:3000
Backend API: http://localhost:8000
Health Check: http://localhost:8000/health
```

### Run Locally (Development Mode)

#### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:8000` automatically via Vite config.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://inventory_user:inventory_pass@localhost:5432/inventory_db` | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed CORS origins |
| `VITE_API_URL` | `/api` (empty → proxied via nginx) | Backend API base URL for frontend |

---

## API Documentation

### Products

#### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Wireless Mouse",
  "sku": "WM-001",
  "price": 29.99,
  "quantity_in_stock": 100
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "name": "Wireless Mouse",
  "sku": "WM-001",
  "price": 29.99,
  "quantity_in_stock": 100,
  "created_at": "2026-06-01T10:00:00Z"
}
```

#### List All Products
```http
GET /api/products
```

**Response** `200 OK` — Array of product objects.

#### Get Product by ID
```http
GET /api/products/1
```

**Response** `200 OK` — Single product object.

#### Update Product
```http
PUT /api/products/1
Content-Type: application/json

{
  "price": 24.99,
  "quantity_in_stock": 150
}
```

**Response** `200 OK` — Updated product object.

#### Delete Product
```http
DELETE /api/products/1
```

**Response** `204 No Content` — Successfully deleted.  
**Response** `409 Conflict` — Product is referenced in existing orders.

### Customers

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "created_at": "2026-06-01T10:00:00Z"
}
```

#### List All Customers
```http
GET /api/customers
```

#### Get Customer by ID
```http
GET /api/customers/1
```

#### Delete Customer
```http
DELETE /api/customers/1
```

**Response** `204 No Content` — Successfully deleted.  
**Response** `409 Conflict` — Customer has existing orders.

### Orders

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 1 }
  ]
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "customer_id": 1,
  "customer_name": "John Doe",
  "total_amount": 84.97,
  "status": "pending",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 2,
      "unit_price": 29.99
    },
    {
      "id": 2,
      "product_id": 2,
      "product_name": "Keyboard",
      "quantity": 1,
      "unit_price": 24.99
    }
  ],
  "created_at": "2026-06-01T10:00:00Z"
}
```

**Response** `400 Bad Request` — Insufficient stock.

#### List All Orders
```http
GET /api/orders
```

#### Get Order by ID
```http
GET /api/orders/1
```

**Response** `200 OK` — Order with items, customer name, total, and status.

#### Cancel Order
```http
DELETE /api/orders/1
```

**Response** `204 No Content` — Order cancelled, stock restored.

### Health Check
```http
GET /api/health
```

**Response** `200 OK`
```json
{
  "status": "ok"
}
```

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Backend API** | Render | [https://inventory-backend-latest-l5kb.onrender.com](https://inventory-backend-latest-l5kb.onrender.com) |
| **Frontend** | Vercel | [https://ethara-ai-nine-beta.vercel.app](https://ethara-ai-nine-beta.vercel.app) |
| **Docker Image** | Docker Hub | [neviljo/inventory-backend:latest](https://hub.docker.com/r/neviljo/inventory-backend) |

### Deployed Environment Variables

**Backend (Render):**
- `DATABASE_URL` — Managed PostgreSQL connection string from Render
- `CORS_ORIGINS` — `https://ethara-ai-nine-beta.vercel.app`

**Frontend (Vercel):**
- `VITE_API_URL` — `https://inventory-backend-latest-l5kb.onrender.com`

---

## Submission Deliverables

| Requirement | Status | Link |
|------------|--------|------|
| GitHub Repository | ✅ | [https://github.com/neviljo/Ethara_AI](https://github.com/neviljo/Ethara_AI) |
| Docker Hub Image | ✅ | [neviljo/inventory-backend:latest](https://hub.docker.com/r/neviljo/inventory-backend) |
| Live Backend API URL | ✅ | [https://inventory-backend-latest-l5kb.onrender.com](https://inventory-backend-latest-l5kb.onrender.com) |
| Live Frontend URL | ✅ | [https://ethara-ai-nine-beta.vercel.app](https://ethara-ai-nine-beta.vercel.app) |

---

## License

MIT © 2026
