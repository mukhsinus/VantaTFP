import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@shared/api/client';
import { Button, Badge } from '@shared/components/ui';
import styles from '../objects.module.css';

interface TaskAssignmentToObjectProps {
  objectId: string;
  onSuccess?: () => void;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface AssignedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_at: string;
}

export const TaskAssignmentToObject: React.FC<TaskAssignmentToObjectProps> = ({
  objectId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/tasks', { params: { limit: 100, status: 'todo,in_progress' } });
      return res.data;
    },
    staleTime: 60000,
  });

  // Fetch assigned tasks
  const { data: assignedResponse, refetch: refetchAssigned } = useQuery({
    queryKey: ['object-tasks', objectId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/objects/${objectId}/tasks`);
      return res.data;
    },
    staleTime: 30000,
  });

  // Assign task mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskId) return;
      await apiClient.post(
        `/api/v1/objects/${objectId}/tasks/${selectedTaskId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks', objectId] });
      setSelectedTaskId('');
      setSearchTerm('');
      onSuccess?.();
    },
  });

  // Remove task mutation
  const removeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(
        `/api/v1/objects/${objectId}/tasks/${taskId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks', objectId] });
      refetchAssigned();
    },
  });

  const handleAssign = () => {
    if (selectedTaskId) {
      assignMutation.mutate();
    }
  };

  const tasks = tasksData?.data || [];
  const assignedTasks = assignedResponse?.tasks || [];
  const assignedTaskIds = new Set(assignedTasks.map((t: AssignedTask) => t.id));

  const availableTasks = tasks.filter((task: Task) => {
    const isAssigned = assignedTaskIds.has(task.id);
    const matchesSearch = searchTerm
      ? task.title.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return !isAssigned && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={styles['task-assignment-to-object']}>
      <h3>{t('objects.labels.assignTasks') || 'Assign Tasks'}</h3>

      {/* Assigned Tasks */}
      <div className={styles['assigned-tasks']}>
        {assignedTasks.length > 0 ? (
          <div className={styles['task-list']}>
            {assignedTasks.map((task: AssignedTask) => (
              <div key={task.id} className={styles['task-item']}>
                <div className={styles['task-info']}>
                  <p className={styles['task-title']}>{task.title}</p>
                  <div className={styles['task-badges']}>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary">{task.status}</Badge>
                  </div>
                </div>
                <button
                  className={styles['btn-remove']}
                  onClick={() => removeMutation.mutate(task.id)}
                  disabled={removeMutation.isPending}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles['empty-message']}>No tasks assigned yet</p>
        )}
      </div>

      {/* Assignment Form */}
      <div className={styles['assignment-form']}>
        <div className={styles['form-row']}>
          <div className={styles['form-group']} style={{ flex: 1 }}>
            <label htmlFor="task-search">Select Task</label>
            <input
              id="task-search"
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles['input']}
            />
            {availableTasks.length > 0 && (
              <div className={styles['task-dropdown']}>
                {availableTasks.slice(0, 5).map((task: Task) => (
                  <button
                    key={task.id}
                    className={styles['dropdown-item']}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setSearchTerm(task.title);
                    }}
                  >
                    <div>
                      <p>{task.title}</p>
                      <small>{task.priority}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedTaskId || assignMutation.isPending}
            style={{ alignSelf: 'flex-end' }}
          >
            Assign Task
          </Button>
        </div>
      </div>
    </div>
  );
};
