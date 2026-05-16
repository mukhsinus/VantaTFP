import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@shared/api/client';
import { Button, Badge, EmptyState, PageSkeleton, Input, ConfirmModal } from '@shared/components/ui';
import { EmployeeAssignment } from './EmployeeAssignment';
import { TaskAssignmentToObject } from './TaskAssignmentToObject';
import styles from '../objects.module.css';

interface ObjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface ObjectRecord {
  id: string;
  name: string;
  description: string | null;
  object_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ObjectDetailsProps {
  objectId: string;
  onTaskCreate?: () => void;
  onTaskSelect?: (task: ObjectTask) => void;
}

export const ObjectDetails: React.FC<ObjectDetailsProps> = ({
  objectId,
  onTaskCreate,
  onTaskSelect,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ObjectRecord>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch object details
  const {
    data: object,
    isLoading: objectLoading,
    error: objectError,
    refetch: refetchObject,
  } = useQuery({
    queryKey: ['objects', objectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/api/v1/objects/${objectId}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching object:', err);
        throw new Error('Failed to load object details');
      }
    },
    staleTime: 30000,
    retry: 2,
  });

  // Fetch tasks for this object
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['object-tasks', objectId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/api/v1/objects/${objectId}/tasks`);
        return res.data;
      } catch (err) {
        console.error('Error fetching tasks:', err);
        throw new Error('Failed to load tasks');
      }
    },
    staleTime: 30000,
    retry: 2,
  });

  // Update object mutation
  const updateObjectMutation = useMutation({
    mutationFn: async (updates: Partial<ObjectRecord>) => {
      const res = await apiClient.patch(`/api/v1/objects/${objectId}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId] });
      setIsEditing(false);
    },
  });

  // Delete object mutation
  const deleteObjectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/v1/objects/${objectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });

  if (objectLoading) {
    return <PageSkeleton />;
  }

  if (objectError) {
    console.error('Object fetch error:', objectError);
    return (
      <EmptyState
        title={t('objects.messages.loadFailed') || 'Failed to load object'}
        description={objectError instanceof Error ? objectError.message : 'An unexpected error occurred.'}
        action={{ label: t('common.actions.tryAgain') || 'Try again', onClick: () => refetchObject() }}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
    );
  }

  if (!object || !object.id) {
    console.warn('No object data returned from API');
    return (
      <EmptyState
        title={t('objects.messages.notFound') || 'Object not found'}
        description={t('objects.messages.notFoundDesc') || "The object you're looking for doesn't exist or has been deleted."}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
    );
  }

  const handleSave = () => {
    if (editData.name && editData.name.trim()) {
      updateObjectMutation.mutate(editData);
    }
  };

  const objectTypes = ['equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other'];

  const tasks = tasksResponse?.data || [];

  return (
    <div className={styles['object-details']}>
      <div className={styles['object-details__header']}>
        <div className={styles['object-details__title-section']}>
          {isEditing ? (
            <Input
              type="text"
              value={editData.name || object.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              placeholder="Object name"
            />
          ) : (
            <>
              <h1>{object.name}</h1>
              <Badge variant={object.status === 'active' ? 'success' : 'default'}>
                {object.status}
              </Badge>
            </>
          )}
        </div>

        <div className={styles['object-details__actions']}>
          {!isEditing && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditData(object);
                  setIsEditing(true);
                }}
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                }
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                }
              >
                Delete
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={updateObjectMutation.isPending}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles['object-details__info']}>
        <div className={styles['info-row']}>
          <label>{t('objects.labels.type') || 'Type'}</label>
          {isEditing ? (
            <select
              value={editData.object_type || object.object_type}
              onChange={(e) =>
                setEditData({ ...editData, object_type: e.target.value })
              }
              className={styles['form-group']}
            >
              {objectTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <span>{object.object_type.charAt(0).toUpperCase() + object.object_type.slice(1)}</span>
          )}
        </div>

        <div className={styles['info-row']}>
          <label>{t('objects.labels.description') || 'Description'}</label>
          {isEditing ? (
            <textarea
              value={editData.description || object.description || ''}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className={styles['form-group']}
              rows={4}
              placeholder="Add a description..."
            />
          ) : (
            <p>{object.description || <em style={{ color: 'var(--color-text-secondary)' }}>No description</em>}</p>
          )}
        </div>

        <div className={styles['info-row']}>
          <label>{t('objects.labels.created') || 'Created'}</label>
          <span>{new Date(object.created_at).toLocaleString()}</span>
        </div>

        <div className={styles['info-row']}>
          <label>{t('objects.labels.updated') || 'Updated'}</label>
          <span>{new Date(object.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div className={styles['object-details__tasks']}>
        <div className={styles['tasks-header']}>
          <h2>{t('objects.labels.associatedTasks') || 'Associated Tasks'}</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={onTaskCreate}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Add Task
          </Button>
        </div>

        {tasksLoading && <PageSkeleton />}

        {tasksError && (
          <EmptyState
            title="Failed to load tasks"
            description="Unable to load tasks for this object."
            action={{ label: 'Try again', onClick: () => refetchTasks() }}
          />
        )}

        {tasks.length === 0 && !tasksLoading && !tasksError && (
          <EmptyState
            title="No tasks yet"
            description="Tasks associated with this object will appear here."
            action={onTaskCreate ? { label: 'Create Task', onClick: onTaskCreate } : undefined}
          />
        )}

        {tasks.length > 0 && (
          <div className={styles['tasks-list']}>
            {tasks.map((task: ObjectTask) => (
              <div
                key={task.id}
                className={styles['task-item']}
                onClick={() => onTaskSelect?.(task)}
              >
                <div className={styles['task-item__main']}>
                  <h4>{task.title}</h4>
                  <Badge variant={task.status === 'completed' ? 'success' : 'default'}>
                    {task.status}
                  </Badge>
                  {task.priority && (
                    <Badge
                      variant={
                        task.priority === 'critical'
                          ? 'danger'
                          : task.priority === 'high'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {task.priority}
                    </Badge>
                  )}
                </div>
                {task.due_date && (
                  <span className={styles['task-item__status']}>
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Object"
          message={`Are you sure you want to delete "${object.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            deleteObjectMutation.mutate();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          isDangerous
          isLoading={deleteObjectMutation.isPending}
        />
      )}

      {/* Employee Assignment Section */}
      <EmployeeAssignment objectId={objectId} />

      {/* Task Assignment Section */}
      <TaskAssignmentToObject objectId={objectId} />
    </div>
  );
};
