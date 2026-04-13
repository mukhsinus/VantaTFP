# TFP — Production Technical Specification

## 1. Product Overview
TFP is a multi-tenant SaaS system for managing tasks, employees, KPI, and payroll. The main goal is to give employers full control over employees, tasks, and salaries in a максимально simple interface. Target audience: SMB businesses and offline teams (construction, services, production).

## 2. Critical Priority — Mobile First
NON-NEGOTIABLE: The system must be designed mobile-first. 90–99% of users are on smartphones. UI/UX must be максимально simple, fast, and not overloaded. Any action must be completed in 2–3 taps. UI principles: large tap-friendly buttons, vertical layout, minimal text, no small elements, fast access to tasks/employees/KPI. Mandatory mobile UX: sticky CTA (e.g. "Create Task"), horizontal scroll for cards, full-width elements, simplified forms.

## 3. Core Architecture
Frontend (React + Vite) → API Layer (Fastify REST + WebSocket) → Service Layer (Business Logic) → Repository Layer → PostgreSQL (Supabase) + Redis + BullMQ. Architecture style: Modular Monolith, Domain-driven modules, Event-driven (partial), Stateless API. Strict separation: controller = thin, service = logic, repository = DB only.

## 4. Roles & Access Model
Super Admin: full access, system control, tenant management, payment confirmations, override any action. Tenant Owner (Employer): creates company, purchases plan, creates employees, manages tasks, sees KPI and payroll. Employee: receives tasks, updates statuses, sees own KPI, cannot register самостоятельно. RBAC must be policy-based (can(user, action, resource)) instead of hardcoded roles.

## 5. Auth & Registration
Entry screen: [I am Employer] [I am Employee]. Employer registration is public with fields: name (required), phone or email (required), password (required). After registration: tenant is created, role = owner, organization is created, trial is activated (15 days), user is prompted to buy a plan. Employee registration is NOT allowed. Employees are created only by employer with fields: phone (required, globally unique), name (optional), role_description (e.g. "painter", "designer"), password (min 4 chars, no complexity requirements). Employee login: phone + simple password. Phone is the unique identifier; names are optional and used only for employer convenience.

## 6. Billing & Payments
Trial: 15 days free, auto-activated. Plans: Basic ($5/month): up to 2 employees, up to 50 tasks/month, basic KPI, no payroll automation, no analytics. Pro ($10/month): up to 20 employees, up to 500 tasks/month, extended KPI, basic payroll, notifications. Business ($50/month): up to 50 employees, up to 2000 tasks/month, full KPI, full payroll, priority processing. Enterprise ($200/month): unlimited everything, full access. Limits must be enforced via backend middleware (hard enforcement). When limits exceeded: block actions and show upgrade UI. Payment flow (manual): user clicks "Buy Plan" → shows card 5614681626029502 → user pays manually → clicks "I paid" → payment_request created → admin confirms → plan activated. payments table: id, tenant_id, amount, status (pending/confirmed/rejected), proof (optional), created_at.

## 7. Core Modules
Organization: tenant management, employee creation, structure. Users: profiles, roles, tenant binding. Tasks: CRUD, assignment, statuses (todo, in_progress, review, done). Task Tracking: comments, audit log (mandatory), time tracking. KPI Engine: metrics (completed tasks, on-time tasks, delayed tasks), score calculation. Payroll Engine: base salary, per-task bonus, KPI bonus, monthly aggregation. Financial System: wallets, transactions, escrow, payouts. Notifications: in-app + WebSocket push. Messaging: real-time chat, attachments, read receipts. Admin Panel: users management, payouts moderation, payments confirmation, tenants control.

## 8. Event System
Flow: task.completed → kpi.recalculate → payroll.recalculate → notification.send. Must be implemented via BullMQ + Redis workers (async processing).

## 9. Database Design
Every table MUST contain tenant_id. Core tables: tenants, users, tasks, task_history, kpi_records, payrolls, wallets, transactions, escrow_accounts, payouts, payments, notifications.

## 10. Security
JWT authentication, tenant isolation middleware (strict), RBAC policy layer, rate limiting, security headers (helmet), input validation (Zod).

## 11. Performance
Redis caching (KPI, dashboards), pagination everywhere, lazy loading, avoid heavy queries in request path.

## 12. Financial Safety
DB transactions for payroll, payouts, escrow. Idempotency keys for all financial operations. Immutable audit logs for all financial changes.

## 13. Frontend
Pages: Auth, Dashboard, Tasks, Employees, KPI, Payroll, Billing, Messages, Settings. Requirements: mobile-first, fast UX, minimal clicks, optimistic updates.

## 14. Deployment
Backend: Railway or VPS (Docker). Frontend: Cloudflare Pages. Database: Supabase.

## 15. Monitoring
Pino logs, health endpoint, error tracking.

## 16. Production Checklist
Auth stable, tenant isolation works, billing flow works, employee creation works, tasks work, KPI calculated, payroll calculated, payments confirmed, mobile UX validated.

## 17. Known Gaps
Policy-based RBAC, KPI engine finalization, payroll engine completion, billing automation (future), mobile UX polishing.

## 18. Final Notes
Do NOT use microservices. All business logic must live strictly in the service layer.

