# Object Management Module - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing and using the Object Management module in your TFP ERP application.

## File Structure

```
backend/
├── db/migrations/
│   ├── 20260415100000_create_objects_and_object_tasks.up.sql
│   └── 20260415100000_create_objects_and_object_tasks.down.sql
└── src/modules/objects/
    ├── objects.controller.ts    # Route handlers
    ├── objects.service.ts       # Business logic
    ├── objects.repository.ts    # Database layer
    ├── objects.schema.ts        # Validation schemas
    ├── README.md               # API documentation
    └── index.ts                # Exports

frontend/src/features/objects/
├── components/
│   ├── ObjectsList.tsx         # List view component
│   ├── ObjectDetails.tsx       # Details view component
│   ├── TaskAssignment.tsx      # Task creation/edit modal
│   ├── ObjectsManagementPage.tsx # Main page component
│   └── index.ts               # Component exports
├── hooks/
│   ├── useObjects.ts           # React Query hooks
│   └── index.ts               # Hook exports
├── objects.module.css          # Styling
├── index.ts                   # Feature exports
└── README.md                 # Feature documentation
```

## Getting Started

### 1. Setup Database

Run the migration to create tables:

```bash
cd backend
npm run migrate:up
```

Verify migration:
```bash
npm run migrate:status
```

### 2. Backend Integration

The objects module is already registered in `backend/src/app.ts`:

```typescript
import { objectsRoutes } from './modules/objects/objects.controller.js';

// In buildApp():
await app.register(objectsRoutes, { prefix: '/api/v1/objects' });
```

No additional backend setup needed if you've run migrations.

### 3. Frontend Integration

Import the main page component:

```typescript
// In your pages or app routing
import { ObjectsManagementPage } from '@/features/objects';

export default function App() {
  return (
    <div>
      {/* Other components */}
      <ObjectsManagementPage />
    </div>
  );
}
```

Or use individual components:

```typescript
import { ObjectsList, ObjectDetails, TaskAssignment } from '@/features/objects';

// In your component
const [selectedObject, setSelectedObject] = useState(null);

return (
  <>
    <ObjectsList onObjectSelect={setSelectedObject} />
    {selectedObject && <ObjectDetails objectId={selectedObject.id} />}
  </>
);
```

## API Usage Examples

### Backend (TypeScript/Fastify)

#### Create an Object

```typescript
const response = await api.post('/api/v1/objects', {
  name: 'Excavator Unit 1',
  description: 'CAT 320 excavator',
  object_type: 'equipment',
  status: 'active',
  metadata: {
    model: 'CAT 320',
    serialNumber: 'ABC123',
    year: 2022
  }
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Get Object with Tasks

```typescript
const object = await api.get('/api/v1/objects/object-id', {
  headers: { Authorization: `Bearer ${token}` }
});

const tasks = await api.get('/api/v1/objects/tasks', {
  params: { object_id: 'object-id', limit: 50 },
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Update Task Status

```typescript
// Start task
await api.post('/api/v1/objects/tasks/task-id/start', {}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Complete task
await api.post('/api/v1/objects/tasks/task-id/complete', {
  notes: 'Task completed successfully'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Frontend (React)

#### Using Hooks

```typescript
import { 
  useObjects, 
  useCreateObjectTask,
  useCompleteObjectTask 
} from '@/features/objects';

function MyComponent() {
  // Fetch objects
  const { data: objects, isLoading } = useObjects({
    page: 1,
    object_type: 'equipment'
  });

  // Create task
  const createTask = useCreateObjectTask();
  
  const handleCreateTask = () => {
    createTask.mutate({
      object_id: 'obj-id',
      title: 'Maintenance',
      priority: 'high',
      due_date: new Date('2026-05-15')
    });
  };

  // Complete task
  const completeTask = useCompleteObjectTask('task-id');
  
  const handleComplete = () => {
    completeTask.mutate('Task completed successfully');
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {objects?.data.map(obj => (
        <div key={obj.id}>
          <h3>{obj.name}</h3>
          <button onClick={handleCreateTask}>Add Task</button>
          <button onClick={handleComplete}>Mark Complete</button>
        </div>
      ))}
    </div>
  );
}
```

#### Using Components

```typescript
import { ObjectsList, ObjectDetails, TaskAssignment } from '@/features/objects';
import { useState } from 'react';

function ObjectsPage() {
  const [selected, setSelected] = useState(null);
  const [showTask, setShowTask] = useState(false);

  return (
    <div>
      {!selected ? (
        <ObjectsList onObjectSelect={setSelected} />
      ) : (
        <>
          <ObjectDetails 
            objectId={selected.id}
            onTaskCreate={() => setShowTask(true)}
          />
          {showTask && (
            <TaskAssignment
              objectId={selected.id}
              onSuccess={() => setShowTask(false)}
              onCancel={() => setShowTask(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
```

## Styling

Components use CSS modules. Import in your component:

```typescript
import styles from '@/features/objects/objects.module.css';

<div className={styles['objects-list']}>
  {/* Content */}
</div>
```

Or use the global class names directly if CSS modules are imported globally:

```typescript
<div className="objects-list">
  {/* Content */}
</div>
```

## Role-Based Access

```typescript
// Admin and Manager can create/update/delete
// Employee can only view and mark tasks complete

// Backend enforces with requireRoles middleware:
app.post('/', 
  { preHandler: [authenticate, requireRoles('ADMIN', 'MANAGER')] },
  // Handler
);
```

## Multi-Tenant Support

All data is automatically scoped by tenant_id:

```typescript
// User's tenant automatically included
const objects = await objectsService.listObjects(
  request.user.tenantId,  // Automatically enforced
  query
);
```

## Error Handling

Handle errors in frontend:

```typescript
const createObject = useMutation({
  mutationFn: async (data) => await api.post('/objects', data),
  onError: (error) => {
    // Handle error
    if (error.response?.status === 404) {
      alert('Object not found');
    } else if (error.response?.status === 403) {
      alert('You do not have permission');
    }
  }
});
```

Handle errors in backend:

```typescript
try {
  const task = await objectsService.getObjectTask(tenantId, taskId);
  if (!task) {
    throw ApplicationError.notFound('Task');
  }
} catch (error) {
  app.log.error({ error }, 'Failed to get task');
  return reply.status(error.statusCode).send(error.body);
}
```

## Audit Logging

All changes are logged automatically. Access logs:

```typescript
// Frontend
const { data: logs } = useQuery({
  queryKey: ['audit-logs', objectId],
  queryFn: () => api.get(`/api/v1/objects/${objectId}/audit-logs`)
});

// Backend
const logs = await objectsService.getObjectAuditLogs(
  tenantId,
  entityId
);

// Database query
SELECT * FROM object_audit_logs 
WHERE object_id = $1 OR object_task_id = $1
ORDER BY created_at DESC;
```

## Performance Tips

1. **Pagination**: Always use pagination on list endpoints
   ```typescript
   const { data } = useObjects({ page: 1, limit: 50 });
   ```

2. **Filtering**: Filter on backend, not frontend
   ```typescript
   useObjects({ object_type: 'equipment', status: 'active' })
   ```

3. **Caching**: React Query caches automatically
   ```typescript
   // Query will not refetch for 30 seconds
   useObjects({ /* ... */ }, { staleTime: 30000 })
   ```

4. **Lazy Loading**: Load details only when needed
   ```typescript
   const { data } = useObject(objectId, { enabled: !!selectedId })
   ```

## Common Tasks

### Create Equipment Object

```typescript
const createEquipment = async () => {
  const response = await api.post('/api/v1/objects', {
    name: 'Excavator #1',
    object_type: 'equipment',
    description: 'Main excavator for site A',
    status: 'active',
    metadata: {
      location: 'Site A',
      operator: 'John Doe'
    }
  });
  return response.data;
};
```

### Assign Task to Equipment

```typescript
const assignTask = async (objectId, userId) => {
  const response = await api.post('/api/v1/objects/tasks', {
    object_id: objectId,
    title: 'Daily Maintenance',
    assigned_to: userId,
    priority: 'high',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    estimated_duration_minutes: 30
  });
  return response.data;
};
```

### Track Task Progress

```typescript
const trackTask = async (taskId) => {
  // Start task
  await api.post(`/api/v1/objects/tasks/${taskId}/start`);
  
  // Later, complete task
  await api.post(`/api/v1/objects/tasks/${taskId}/complete`, {
    notes: 'Maintenance completed successfully'
  });
};
```

### Search Objects

```typescript
const searchObjects = async (searchTerm) => {
  const response = await api.get('/api/v1/objects', {
    params: {
      search: searchTerm,
      page: 1,
      limit: 20
    }
  });
  return response.data;
};
```

## Testing

### Backend Test Example

```typescript
describe('ObjectsService', () => {
  let service: ObjectsService;
  let repository: ObjectsRepository;

  beforeEach(() => {
    repository = new ObjectsRepository(mockDb);
    service = new ObjectsService(repository);
  });

  it('should create object with valid input', async () => {
    const result = await service.createObject('tenant-id', 'user-id', {
      name: 'Test Equipment',
      object_type: 'equipment'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Equipment');
  });
});
```

### Frontend Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { ObjectsList } from '@/features/objects';

describe('ObjectsList', () => {
  it('should render list of objects', () => {
    render(<ObjectsList />);
    expect(screen.getByText('Objects')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **404 Not Found**
   - Check object ID is valid UUID
   - Verify tenant_id matches
   - Ensure object exists in database

2. **403 Unauthorized**
   - Check JWT token is valid
   - Verify user role (ADMIN, MANAGER required for write operations)
   - Check tenant ownership

3. **Validation Error**
   - Check required fields (name, object_type)
   - Verify enum values are valid
   - Check date format (ISO 8601)

4. **Migration Failed**
   - Check database connection
   - Verify PostgreSQL is running
   - Check migration file syntax

### Debug Mode

Enable detailed logging:

```typescript
// Backend
app.log.debug({ object, task }, 'Creating task for object');

// Frontend
console.log('Creating task:', taskData);
```

## Next Steps

1. **Customize**: Add your own metadata fields to objects
2. **Integrate**: Connect with your existing components
3. **Extend**: Add workflows, approvals, or notifications
4. **Monitor**: Track usage and performance metrics

## Support Resources

- Backend API docs: `backend/src/modules/objects/README.md`
- Frontend component docs: `frontend/src/features/objects/README.md`
- Database migrations: `backend/db/migrations/`
- Example usage: This file and inline code comments

## License

MIT - Feel free to modify and extend for your needs
