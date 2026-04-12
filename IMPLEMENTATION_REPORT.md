# VantaTFP — Implementation Report

> Generated: April 12, 2026

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites & Local Setup](#prerequisites--local-setup)
3. [Database Migrations](#database-migrations)
4. [Backend Modules](#backend-modules)
5. [Frontend Entities & API Layer](#frontend-entities--api-layer)
6. [Frontend Feature Hooks](#frontend-feature-hooks)
7. [Frontend Pages](#frontend-pages)
8. [Router & Navigation](#router--navigation)
9. [Feature Flags System](#feature-flags-system)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Modified Files Summary](#modified-files-summary)
13. [Architecture Decisions](#architecture-decisions)

---

## Overview

A comprehensive feature expansion was implemented to bring VantaTFP closer to ClickUp/Notion feature parity. All new features are gated behind a **feature flags system** that allows admins to show/hide each capability per tenant.

### New Capabilities Added

| Feature | Backend | Frontend | Feature Flag Key |
|---------|---------|----------|-----------------|
| Projects & Spaces | ✅ | ✅ | `projects` |
| Subtasks (parent_task_id) | ✅ (migration) | — | `subtasks` |
| Task Comments (threaded) | ✅ | ✅ (hooks) | `comments` |
| Labels / Tags | ✅ | ✅ (hooks) | `labels` |
| Custom Fields | ✅ (migration) | — | `custom_fields` |
| Task Dependencies | ✅ (migration) | — | `dependencies` |
| Multiple Assignees | ✅ (migration) | — | `multiple_assignees` |
| Task Templates | ✅ | ✅ | `templates` |
| Story Points / Estimates | ✅ (migration) | — | `estimates` |
| Documents / Wiki | ✅ | ✅ | `documents` |
| Task Attachments | ✅ (migration) | — | `attachments` |
| Recurring Tasks | ✅ (migration) | — | `recurring_tasks` |
| Automations / Workflows | ✅ | ✅ | `automations` |
| Feature Flags Management | ✅ | ✅ | — (always on) |
| Time Tracking | ✅ (migration) | — | `time_tracking` |

---

## Prerequisites & Local Setup

### Required Services

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL 16 | 5432 | Installed (Windows service `postgresql-x64-16`) — **must be started manually** |
| Redis | 6379 | **Not installed** — must be installed |

### Starting PostgreSQL (Admin terminal required)

```powershell
net start postgresql-x64-16
```

Or open `services.msc` → find `postgresql-x64-16` → Start.

### Installing Redis on Windows

**Option A — Install via winget:**
```powershell
winget install Redis.Redis
# Then start the service:
net start Redis
```

**Option B — Memurai (native Windows Redis alternative):**
Download from https://www.memurai.com/

**Option C — Docker (if available):**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Environment Variables

File: `backend/.env` (created from `.env.example`)

Required values to configure:
```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/tfp_db
DB_URL=postgresql://<user>:<password>@localhost:5432/tfp_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_local_secret_change_me_in_production_1234567890
```

### Running the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — Worker (optional, for BullMQ jobs)
cd backend
npm run dev:worker
```

### Running Migrations

```bash
cd backend
npm run migrate:up
```

---

## Database Migrations

**5 new migration pairs** (10 SQL files) were created under `backend/db/migrations/`:

### 20260412100000_feature_flags

Creates the `feature_flags` table:
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `feature_key` (VARCHAR 100)
- `enabled` (BOOLEAN, default true)
- UNIQUE constraint on `(tenant_id, feature_key)`

### 20260412100100_projects_and_subtasks

Creates the `projects` table and extends `tasks`:
- **projects**: id, tenant_id, parent_id (self-ref), name, description, color, icon, sort_order, archived, created_by
- **tasks additions**: project_id (FK → projects), parent_task_id (FK → tasks, self-ref), sort_order, estimate_points, estimate_minutes

### 20260412100200_comments_and_labels

Creates 3 tables:
- **task_comments**: id, tenant_id, task_id, author_id, parent_comment_id (threading), content, edited
- **labels**: id, tenant_id, name, color
- **task_labels**: task_id + label_id junction table

### 20260412100300_custom_fields_deps_assignees

Creates 3 tables:
- **custom_field_definitions**: id, tenant_id, name, field_type (text/number/date/select/checkbox), options (JSONB), required, sort_order
- **task_custom_field_values**: task_id + field_id + value (JSONB)
- **task_dependencies**: task_id + depends_on_task_id + dependency_type (blocks/blocked_by/related)
- **task_assignees**: task_id + user_id junction (for multiple assignees)

### 20260412100400_templates_docs_attachments_recurring_automations

Creates 5 tables:
- **task_templates**: id, tenant_id, name, description, default_priority, checklist (JSONB), default_labels (JSONB), estimate defaults
- **documents**: id, tenant_id, project_id, parent_id, title, content (TEXT), content_type, icon, cover_url, is_template, archived, sort_order, created_by, last_edited_by
- **task_attachments**: id, tenant_id, task_id, file_name, file_url, file_size, mime_type, uploaded_by
- **recurring_task_rules**: id, tenant_id, template_id, rrule (iCalendar RRULE), next_run_at, is_active
- **automation_rules**: id, tenant_id, name, description, trigger_type, trigger_config (JSONB), action_type, action_config (JSONB), is_active, execution_count, last_executed_at, created_by

---

## Backend Modules

**7 new modules** created under `backend/src/modules/`, each following the standard 4-file pattern:

| File | Purpose |
|------|---------|
| `*.schema.ts` | Zod validation schemas for request/response |
| `*.repository.ts` | SQL queries with `enforceTenantScope()` |
| `*.service.ts` | Business logic layer |
| `*.controller.ts` | Fastify route handlers with role guards |

### feature-flags

- **Routes**: `GET /api/v1/feature-flags` (all roles), `PATCH /api/v1/feature-flags` (ADMIN), `PUT /api/v1/feature-flags/bulk` (ADMIN)
- **Key behavior**: `ensureDefaults()` auto-seeds all 16 feature keys on first fetch; returns a `Record<string, boolean>` map
- **Feature keys**: projects, subtasks, comments, labels, custom_fields, dependencies, multiple_assignees, templates, estimates, documents, attachments, recurring_tasks, calendar_view, timeline_view, automations, time_tracking

### projects

- **Routes**: full CRUD at `/api/v1/projects`
- **Roles**: GET (all authenticated), POST/PATCH/DELETE (ADMIN, MANAGER)
- **Features**: nested via `parent_id`, supports color, icon, sort_order, archived flag

### comments

- **Routes**: nested under `/api/v1/tasks/:taskId/comments`
- **Roles**: GET/POST (all), PATCH (own comments), DELETE (ADMIN/MANAGER or own)
- **Features**: threaded via `parent_comment_id`, author lookup via JOIN, `edited` flag on update

### labels

- **Routes**: CRUD at `/api/v1/labels` + `GET/PUT /api/v1/labels/task/:taskId`
- **Roles**: GET (all), CUD (ADMIN, MANAGER)
- **Features**: task-label associations via junction table, bulk set labels on task

### documents

- **Routes**: full CRUD at `/api/v1/documents`
- **Roles**: GET (all), POST/PATCH/DELETE (ADMIN, MANAGER)
- **Features**: Notion-like docs with markdown/richtext content_type, icons, covers, templates, archiving, nested via parent_id, linked to projects

### automations

- **Routes**: full CRUD at `/api/v1/automations`
- **Roles**: GET (all), CUD (ADMIN only)
- **Features**: trigger_type + action_type with JSONB configs, `executeForTrigger()` placeholder for domain event integration, execution counting

### templates

- **Routes**: full CRUD at `/api/v1/templates`
- **Roles**: GET (all), CUD (ADMIN, MANAGER)
- **Features**: task templates with checklist (JSON array), default labels, priority, estimate points/minutes

### Route Registration

All modules registered in `backend/src/app.ts`:
```typescript
import { featureFlagsController } from './modules/feature-flags/feature-flags.controller';
import { projectsController }     from './modules/projects/projects.controller';
import { commentsController }     from './modules/comments/comments.controller';
import { labelsController }       from './modules/labels/labels.controller';
import { documentsController }    from './modules/documents/documents.controller';
import { automationsController }  from './modules/automations/automations.controller';
import { templatesController }    from './modules/templates/templates.controller';
```

---

## Frontend Entities & API Layer

**7 new entity directories** created under `frontend/src/entities/`, each with 2 files:

| Entity | Types File | API File |
|--------|-----------|----------|
| feature-flags | `FeatureKey`, `FeatureFlagsMap`, `UpdateFeatureFlagPayload` | `list()`, `update()`, `bulkUpdate()` |
| project | `ProjectApiDto`, `ProjectListResponse`, `CreateProjectPayload`, `UpdateProjectPayload` | `list()`, `getById()`, `create()`, `update()`, `delete()` |
| comment | `CommentApiDto`, `CommentListResponse`, `CreateCommentPayload`, `UpdateCommentPayload` | `listByTask()`, `create()`, `update()`, `delete()` |
| label | `LabelApiDto`, `CreateLabelPayload`, `UpdateLabelPayload` | `list()`, `create()`, `update()`, `delete()`, `getTaskLabels()`, `setTaskLabels()` |
| document | `DocumentApiDto`, `DocumentListResponse`, `CreateDocumentPayload`, `UpdateDocumentPayload` | `list()`, `getById()`, `create()`, `update()`, `delete()` |
| automation | `AutomationApiDto`, `AutomationListResponse`, `CreateAutomationPayload`, `UpdateAutomationPayload` | `list()`, `getById()`, `create()`, `update()`, `delete()` |
| template | `TemplateApiDto`, `CreateTemplatePayload`, `UpdateTemplatePayload` | `list()`, `getById()`, `create()`, `update()`, `delete()` |

API endpoints added to `frontend/src/shared/api/endpoints.ts`:
```typescript
featureFlags: { list, update, bulk }
projects:     { list, detail(id) }
comments:     { list(taskId), detail(taskId, commentId) }
labels:       { list, detail(id), taskLabels(taskId) }
documents:    { list, detail(id) }
automations:  { list, detail(id) }
templates:    { list, detail(id) }
```

---

## Frontend Feature Hooks

**6 React Query hook files** under `frontend/src/features/*/hooks/`:

| Hook File | Exported Hooks |
|-----------|---------------|
| `useProjects.ts` | `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` |
| `useComments.ts` | `useComments`, `useCreateComment`, `useUpdateComment`, `useDeleteComment` |
| `useLabels.ts` | `useLabels`, `useTaskLabels`, `useCreateLabel`, `useUpdateLabel`, `useDeleteLabel`, `useSetTaskLabels` |
| `useDocuments.ts` | `useDocuments`, `useDocument`, `useCreateDocument`, `useUpdateDocument`, `useDeleteDocument` |
| `useAutomations.ts` | `useAutomations`, `useCreateAutomation`, `useUpdateAutomation`, `useDeleteAutomation` |
| `useTemplates.ts` | `useTemplates`, `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate` |

All hooks follow the same pattern:
- Query keys factory (e.g. `projectKeys.all`, `.list()`, `.detail(id)`)
- `useQuery` for reads, `useMutation` for writes
- Auto-invalidation on mutation success

---

## Frontend Pages

**4 new page components** under `frontend/src/pages/`:

### ProjectsPage (`/projects`)
- Grid of project cards with color dots, name, description, creation date
- Search filter, create form with name/description/color picker
- Delete action for ADMIN/MANAGER

### DocumentsPage (`/documents`)
- Grid of document cards with emoji icons, title, last-updated date
- Search filter, quick-create by title
- Supports markdown/richtext content types

### AutomationsPage (`/automations`)
- List of automation rules with trigger → action descriptions
- Active/Inactive status badges
- Create form with trigger type and action type dropdowns
- ADMIN-only management

### TemplatesPage (`/templates`)
- Grid of template cards with name, description, priority badge
- Quick-create with name and description
- ADMIN/MANAGER management

All pages:
- Use `useFeature(key)` to show "feature disabled" empty state when toggled off
- Use `useIsMobile()` for responsive layouts
- Use `usePermissions()` for role-based action visibility
- Follow the established pattern from `EmployeesPage`

---

## Router & Navigation

### Router (`frontend/src/app/router.tsx`)

Added 4 new routes inside the `TenantRouteGuard > AppLayout` group:
```tsx
{ path: 'projects',    element: <RoleGuard path="/projects"><ProjectsPage /></RoleGuard> }
{ path: 'documents',   element: <RoleGuard path="/documents"><DocumentsPage /></RoleGuard> }
{ path: 'automations', element: <RoleGuard path="/automations"><AutomationsPage /></RoleGuard> }
{ path: 'templates',   element: <RoleGuard path="/templates"><TemplatesPage /></RoleGuard> }
```

### Role-Based Navigation (`frontend/src/shared/config/role-ui.tsx`)

4 new SVG icons added: `projects`, `documents`, `automations`, `templates`

Updated `NAV_BY_ROLE`:

| Role | New Nav Items |
|------|--------------|
| ADMIN | Projects, Documents, Templates, Automations (+ all existing) |
| MANAGER | Projects, Documents, Templates |
| EMPLOYEE | Projects, Documents |

Updated `ALLOWED_ROLES_BY_ROUTE`:
```
/projects    → ADMIN, MANAGER, EMPLOYEE
/documents   → ADMIN, MANAGER, EMPLOYEE
/automations → ADMIN
/templates   → ADMIN, MANAGER
```

### Role Navigation (`frontend/src/app/navigation/role-navigation.ts`)

Synced with role-ui.tsx — added matching `RoleNavItem` entries with translation label keys.

---

## Feature Flags System

### Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  feature_flags DB   │────▶│  /api/v1/feature-flags│────▶│  Zustand Store   │
│  (per-tenant rows)  │     │  (backend API)        │     │  (frontend state)│
└─────────────────────┘     └──────────────────────┘     └──────────────────┘
                                                                  │
                                                          ┌───────┴───────┐
                                                          ▼               ▼
                                                   Sidebar filter   Page guard
                                                   (hide nav item) (show disabled)
```

### Backend
- **Store**: `feature_flags` table with `(tenant_id, feature_key)` unique constraint
- **Auto-seed**: On first GET, all 16 keys are inserted as `enabled=true`
- **API**: GET (all roles), PATCH single / PUT bulk (ADMIN only)

### Frontend
- **Store**: `frontend/src/app/store/feature-flags.store.ts` — Zustand store
- **Hook**: `useFeature(key)` returns boolean (defaults `true` if not loaded)
- **Bootstrap**: `FeatureFlagsBootstrap` component in `providers.tsx` — loads flags after auth token is available
- **Sidebar**: `ROUTE_FEATURE_MAP` maps route paths to feature keys; nav items hidden when disabled
- **MobileBottomTabs**: Same filtering logic
- **Pages**: Each page checks `useFeature(key)` and shows disabled empty state

---

## Internationalization (i18n)

Translations added to all 3 locale files:

### New Translation Keys

**Nav keys** (`nav.*`):
- `nav.projects`, `nav.documents`, `nav.automations`, `nav.templates`

**Feature sections** — each with `title`, `total`, `create`, `empty.{title,description}`, `disabled.{title,description}`, `fields.*`:
- `projects.*`
- `documents.*`
- `automations.*` (also includes `triggers.*`, `actions.*`, `active`, `inactive`, `subtitle`)
- `templates.*` (also includes `subtitle`)

| Language | File | Status |
|----------|------|--------|
| English | `frontend/src/shared/i18n/locales/en.json` | ✅ Complete |
| Russian | `frontend/src/shared/i18n/locales/ru.json` | ✅ Complete |
| Uzbek | `frontend/src/shared/i18n/locales/uz.json` | ✅ Complete |

---

## CI/CD Pipeline

File: `.github/workflows/ci.yml`

**Trigger**: Push/PR to `main` or `develop` branches.

### Jobs

| Job | Steps | Purpose |
|-----|-------|---------|
| **Backend** | checkout → setup-node@20 → `npm ci` → `typecheck` → `build` | TypeScript compilation + build verification |
| **Frontend** | checkout → setup-node@20 → `npm ci` → `typecheck` → `test` → `build` | Types + Vitest tests + Vite production build |
| **Migrations** | checkout → setup-node@20 → `npm ci` → `migrate:validate` | Ensures migration files are consistent |

---

## Modified Files Summary

### New Files Created (59 files)

**Backend — Migrations (10 files)**:
- `backend/db/migrations/20260412100000_feature_flags.{up,down}.sql`
- `backend/db/migrations/20260412100100_projects_and_subtasks.{up,down}.sql`
- `backend/db/migrations/20260412100200_comments_and_labels.{up,down}.sql`
- `backend/db/migrations/20260412100300_custom_fields_deps_assignees.{up,down}.sql`
- `backend/db/migrations/20260412100400_templates_docs_attachments_recurring_automations.{up,down}.sql`

**Backend — Modules (28 files)**:
- `backend/src/modules/{feature-flags,projects,comments,labels,documents,automations,templates}/{*.controller.ts,*.service.ts,*.repository.ts,*.schema.ts}`

**Frontend — Entities (14 files)**:
- `frontend/src/entities/{feature-flags,project,comment,label,document,automation,template}/{*.types.ts,*.api.ts}`

**Frontend — Hooks (6 files)**:
- `frontend/src/features/{projects,comments,labels,documents,automations,templates}/hooks/use*.ts`

**Frontend — Pages (4 files)**:
- `frontend/src/pages/{projects,documents,automations,templates}/*Page.tsx`

**Frontend — Store (1 file)**:
- `frontend/src/app/store/feature-flags.store.ts`

**CI/CD (1 file)**:
- `.github/workflows/ci.yml`

### Existing Files Modified (8 files)

| File | Changes |
|------|---------|
| `backend/src/app.ts` | Added imports + route registrations for 7 new modules |
| `frontend/src/shared/api/endpoints.ts` | Added API paths for all new entities |
| `frontend/src/app/router.tsx` | Added 4 new route entries + page imports |
| `frontend/src/shared/config/role-ui.tsx` | Added 4 icons, updated NAV_BY_ROLE, ALLOWED_ROLES_BY_ROUTE |
| `frontend/src/app/navigation/role-navigation.ts` | Added nav items for all roles |
| `frontend/src/widgets/sidebar/Sidebar.tsx` | Added feature flag filtering for nav items |
| `frontend/src/widgets/mobile-bottom-tabs/MobileBottomTabs.tsx` | Added feature flag filtering |
| `frontend/src/app/providers.tsx` | Added `FeatureFlagsBootstrap` component |
| `frontend/src/shared/i18n/locales/en.json` | Added translation keys for new features |
| `frontend/src/shared/i18n/locales/ru.json` | Added Russian translations |
| `frontend/src/shared/i18n/locales/uz.json` | Added Uzbek translations |
| `backend/.env` | Created from `.env.example` with REDIS_URL and JWT_SECRET |

---

## Architecture Decisions

1. **Feature flags default to `true`** — all features are visible by default; admins opt-out by disabling specific flags. This avoids breaking existing tenants on deployment.

2. **Paginated vs. direct array responses** — Projects, Documents, and Automations use `{ data: T[], total, page, limit, totalPages }` wrapper. Templates and Labels return `T[]` directly. Frontend pages handle both patterns.

3. **Comments nested under tasks** — `/api/v1/tasks/:taskId/comments` instead of `/api/v1/comments` because comments are always task-scoped. Other entities are tenant-scoped top-level resources.

4. **Navigation filtering happens in the UI layer** — Sidebar and MobileBottomTabs filter their nav items using `ROUTE_FEATURE_MAP`. Routes still exist even when hidden (accessing `/projects` directly shows a "feature disabled" empty state).

5. **Migration-only features** — Subtasks, custom fields, dependencies, multiple assignees, attachments, recurring tasks, and time tracking have database tables but no full frontend pages yet. They have backend schemas and migrations ready for future UI implementation.

6. **i18n fallback** — Russian and Uzbek translations merge with English as the fallback base (via `mergeWithFallback`), so missing keys automatically show English text.
