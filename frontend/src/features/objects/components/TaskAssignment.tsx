import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { Button, Input, Modal } from '@shared/components/ui';

interface TaskAssignmentProps {
  objectId: string;
  taskId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface User {
  id: string;
  name: string;
  email?: string;
}

export const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  objectId,
  taskId,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as const,
    status: 'pending' as const,
    due_date: '',
    estimated_duration_minutes: '',
    notes: '',
  });

  // Fetch existing task if editing
  const { data: existingTask } = useQuery({
    queryKey: ['object-task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await apiClient.get(`/api/v1/objects/tasks/${taskId}`);
      return res.data;
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/users', { params: { limit: 100 } });
      return res.data;
    },
    staleTime: 60000,
  });

  // Initialize form with existing task data
  React.useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description || '',
        assigned_to: existingTask.assigned_to || '',
        priority: existingTask.priority,
        status: existingTask.status,
        due_date: existingTask.due_date
          ? new Date(existingTask.due_date).toISOString().split('T')[0]
          : '',
        estimated_duration_minutes: existingTask.estimated_duration_minutes || '',
        notes: existingTask.notes || '',
      });
    }
  }, [existingTask]);

  // Create/Update task mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        object_id: objectId,
        estimated_duration_minutes: formData.estimated_duration_minutes
          ? parseInt(formData.estimated_duration_minutes, 10)
          : null,
        due_date: formData.due_date || null,
      };

      if (taskId) {
        await apiClient.patch(`/api/v1/objects/tasks/${taskId}`, payload);
      } else {
        await apiClient.post('/api/v1/objects/tasks', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks', objectId] });
      queryClient.invalidateQueries({ queryKey: ['object-task', taskId] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Task title is required');
      return;
    }
    mutation.mutate();
  };

  const users = usersData?.data || [];

  return (
    <div className="task-assignment-modal">
      <h2>{taskId ? 'Edit Task' : 'Create Task'}</h2>

      <form onSubmit={handleSubmit} className="task-assignment-modal__form">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="form-group"
            placeholder="Task description"
            rows={3}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="assigned_to">Assign To</label>
            <select
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData({ ...formData, assigned_to: e.target.value })
              }
              className="form-group"
            >
              <option value="">Unassigned</option>
              {users.map((user: User) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as any,
                })
              }
              className="form-group"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="form-group"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Due Date</label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="estimated_duration_minutes">
            Estimated Duration (minutes)
          </label>
          <Input
            id="estimated_duration_minutes"
            type="number"
            value={formData.estimated_duration_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimated_duration_minutes: e.target.value,
              })
            }
            placeholder="e.g., 30"
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="form-group"
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <div className="task-assignment-modal__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
          >
            {taskId ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  );
};
