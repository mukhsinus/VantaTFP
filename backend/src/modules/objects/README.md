# Object Management Module

A comprehensive object management system for the TFP ERP application built with Node.js, Express/Fastify, PostgreSQL, and React. This module allows users to create and manage various objects (equipment, departments, vehicles, locations, etc.) and assign tasks to those objects.

## Features

- **Object Management**
  - Create, read, update, and delete objects
  - Support for multiple object types (equipment, department, vehicle, location, facility, asset, other)
  - Full-text search and filtering
  - Metadata storage for custom properties
  - Audit logging of all changes

- **Task Management**
  - Assign tasks to objects
  - Track task status (pending, in_progress, completed, cancelled)
  - Set priorities (low, medium, high, critical)
  - Due dates and time tracking
  - Task dependencies (optional)
  - Estimated vs. actual duration tracking

- **User Features**
  - Task assignment to specific users
  - Real-time status updates
  - Task history and audit logs
  - Multi-tenant support

## Backend Architecture

### Database Schema

#### Objects Table
```sql
CREATE TABLE objects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  object_type ENUM('equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other'),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Object Tasks Table
```sql
CREATE TABLE object_tasks (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  object_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled'),
  priority ENUM('low', 'medium', 'high', 'critical'),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  estimated_duration_minutes INT,
  actual_duration_minutes INT,
  notes TEXT,
  metadata JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Module Structure

```
backend/src/modules/objects/
├── objects.controller.ts    # REST endpoints (routes)
├── objects.service.ts       # Business logic
├── objects.repository.ts    # Database access layer
├── objects.schema.ts        # Zod validation schemas
└── index.ts                # Module exports
```

### REST API Endpoints

#### Objects
- `POST /api/v1/objects` - Create object
- `GET /api/v1/objects` - List objects (with pagination, filtering)
- `GET /api/v1/objects/:objectId` - Get object details
- `PATCH /api/v1/objects/:objectId` - Update object
- `DELETE /api/v1/objects/:objectId` - Delete object
- `GET /api/v1/objects/:objectId/audit-logs` - Get audit logs

#### Object Tasks
- `POST /api/v1/objects/tasks` - Create task
- `GET /api/v1/objects/tasks` - List tasks (with pagination, filtering)
- `GET /api/v1/objects/tasks/:taskId` - Get task details
- `PATCH /api/v1/objects/tasks/:taskId` - Update task
- `POST /api/v1/objects/tasks/:taskId/start` - Start task
- `POST /api/v1/objects/tasks/:taskId/complete` - Complete task
- `DELETE /api/v1/objects/tasks/:taskId` - Delete task
- `GET /api/v1/objects/tasks/:taskId/audit-logs` - Get task audit logs

### Example Usage

#### Create an Object
```bash
curl -X POST http://localhost:3000/api/v1/objects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Excavator #1",
    "description": "Heavy construction equipment",
    "object_type": "equipment",
    "status": "active",
    "metadata": {
      "location": "Site A",
      "model": "CAT 320",
      "year": 2022
    }
  }'
```

#### Create a Task for Object
```bash
curl -X POST http://localhost:3000/api/v1/objects/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "object_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Maintenance Check",
    "description": "Daily maintenance inspection",
    "assigned_to": "660e8400-e29b-41d4-a716-446655440000",
    "priority": "high",
    "status": "pending",
    "due_date": "2026-05-10T10:00:00Z",
    "estimated_duration_minutes": 30
  }'
```

## Frontend Architecture

### React Components

#### ObjectsList
Displays a paginated list of objects with filtering and search.

```typescript
import { ObjectsList } from '@/features/objects';

<ObjectsList
  onObjectSelect={(object) => console.log(object)}
  showCreate={true}
  onCreateClick={() => setShowCreateModal(true)}
/>
```

#### ObjectDetails
Shows detailed information about an object and its associated tasks.

```typescript
import { ObjectDetails } from '@/features/objects';

<ObjectDetails
  objectId="object-id-here"
  onTaskCreate={() => setShowTaskModal(true)}
  onTaskSelect={(task) => console.log(task)}
/>
```

#### TaskAssignment
Modal component for creating and editing tasks assigned to objects.

```typescript
import { TaskAssignment } from '@/features/objects';

<TaskAssignment
  objectId="object-id-here"
  taskId={editingTaskId}
  onSuccess={() => console.log('Task saved')}
  onCancel={() => setShowModal(false)}
/>
```

#### ObjectsManagementPage
Complete page combining all three components with state management.

```typescript
import { ObjectsManagementPage } from '@/features/objects';

<ObjectsManagementPage />
```

### Custom Hooks

Comprehensive hooks for data fetching and mutations:

```typescript
// Fetching
const { data, isLoading } = useObjects({ page: 1, search: 'excavator' });
const { data: object } = useObject(objectId);
const { data: tasks } = useObjectTasks({ object_id: objectId });

// Mutations
const createObject = useCreateObject();
const updateObject = useUpdateObject(objectId);
const deleteObject = useDeleteObject();
const createTask = useCreateObjectTask();
const startTask = useStartObjectTask(taskId);
const completeTask = useCompleteObjectTask(taskId);

// Usage
createObject.mutate({
  name: 'New Equipment',
  object_type: 'equipment'
});
```

### Component Integration Example

```typescript
import React, { useState } from 'react';
import { ObjectsManagementPage } from '@/features/objects';

export const Dashboard = () => {
  return (
    <div className="dashboard">
      <ObjectsManagementPage />
    </div>
  );
};
```

## Database Migration

### Running Migrations

The module includes SQL migration files:
- `20260415100000_create_objects_and_object_tasks.up.sql` - Creates schema
- `20260415100000_create_objects_and_object_tasks.down.sql` - Reverts schema

To apply migrations:

```bash
npm run migrate:up
```

To check migration status:

```bash
npm run migrate:status
```

To rollback:

```bash
npm run migrate:down
```

## Validation

All inputs are validated using Zod schemas:

```typescript
// Objects
createObjectInputSchema: {
  name: string (required, 1-255 chars)
  description: string (optional)
  object_type: enum (required)
  status: string (optional, default 'active')
  metadata: object (optional)
}

// Tasks
createObjectTaskInputSchema: {
  object_id: UUID (required)
  title: string (required, 1-255 chars)
  description: string (optional)
  assigned_to: UUID (optional)
  status: enum (default 'pending')
  priority: enum (default 'medium')
  due_date: date (optional)
  estimated_duration_minutes: number (optional)
  notes: string (optional)
}
```

## Error Handling

The module uses consistent error handling:

```
ApplicationError.notFound('Object') - 404
ApplicationError.badRequest('Invalid status') - 400
ApplicationError.internalError('Failed to save') - 500
```

## Security

- **Authentication**: JWT tokens required for all endpoints
- **Authorization**: Role-based access control (ADMIN, MANAGER, EMPLOYEE)
- **Tenant Isolation**: All data scoped by tenant_id
- **Validation**: Zod schema validation on all inputs
- **Audit Logging**: All changes logged with actor user ID

## Pagination

List endpoints support pagination:

```typescript
GET /api/v1/objects?page=1&limit=20&object_type=equipment&search=excavator
```

Response:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

## Audit Logging

All operations are logged in the `object_audit_logs` table:

```typescript
{
  id: UUID,
  tenant_id: UUID,
  object_id: UUID,
  object_task_id: UUID,
  actor_user_id: UUID,
  action: string ('OBJECT_CREATED', 'OBJECT_UPDATED', etc.),
  entity_type: string ('OBJECT', 'OBJECT_TASK'),
  old_value: JSONB,
  new_value: JSONB,
  created_at: TIMESTAMPTZ
}
```

## Styling

Components use CSS module styling with:
- Mobile-first responsive design
- Light and dark mode support
- Accessibility considerations
- Semantic HTML structure

Import styles in your component:
```typescript
import styles from '@/features/objects/objects.module.css';
```

## Performance Optimizations

- Pagination on all list endpoints
- React Query for caching and state management
- Database indexes on commonly filtered fields
- Lazy loading of related data
- Debounced search inputs

## Future Enhancements

- [ ] Bulk operations (create, update, delete multiple)
- [ ] Advanced filtering and saved filters
- [ ] Real-time updates via WebSocket
- [ ] File attachments for tasks
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Task dependencies/critical path
- [ ] Gantt chart view
- [ ] Resource allocation and capacity planning
- [ ] Mobile app optimization

## Testing

Example test structure:

```typescript
// objects.service.test.ts
describe('ObjectsService', () => {
  describe('createObject', () => {
    it('should create an object with valid input', async () => {
      // Test implementation
    });
  });
});
```

## Troubleshooting

### Objects not appearing
- Check database migration ran successfully
- Verify tenant_id is correctly set
- Check user has ADMIN/MANAGER role

### Tasks not assigned
- Verify object exists
- Check assigned user ID is valid
- Ensure task priority and status are valid enums

### Performance issues
- Check database indexes are created
- Monitor query count with React Query DevTools
- Consider pagination limits

## Support

For issues or questions, refer to:
1. Backend logs: Check Fastify/Pino logs
2. Frontend console: Browser developer tools
3. Database: Check `object_audit_logs` for changes
4. API responses: Check error messages and status codes

## License

MIT
