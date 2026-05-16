import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ObjectsList } from './ObjectsList';
import { ObjectDetails } from './ObjectDetails';
import { TaskAssignment } from './TaskAssignment';
import { ObjectCreateForm } from './ObjectCreateForm';
import styles from '../objects.module.css';

interface Object {
  id: string;
  name: string;
  description: string | null;
  object_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ObjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
}

type ViewMode = 'list' | 'create' | 'details' | 'task-assignment';

export const ObjectsManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedObject, setSelectedObject] = useState<Object | null>(null);
  const [selectedTask, setSelectedTask] = useState<ObjectTask | null>(null);

  const handleObjectSelect = (object: Object) => {
    setSelectedObject(object);
    setViewMode('details');
  };

  const handleCreateObject = () => {
    setSelectedObject(null);
    setViewMode('create');
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setViewMode('task-assignment');
  };

  const handleTaskSelect = (task: ObjectTask) => {
    setSelectedTask(task);
    setViewMode('task-assignment');
  };

  const handleTaskAssignmentSuccess = () => {
    setViewMode('details');
    setSelectedTask(null);
  };

  const handleTaskAssignmentCancel = () => {
    setViewMode('details');
  };

  const handleBackToList = () => {
    setSelectedObject(null);
    setSelectedTask(null);
    // Invalidate objects cache to refresh the list with any new objects
    queryClient.invalidateQueries({ queryKey: ['objects'] });
    setViewMode('list');
  };

  const handleObjectCreated = (object: Object) => {
    setSelectedObject(object);
    setViewMode('details');
  };

  return (
    <div className="objects-management-page">
      {/* Header - only show for details view (not for list, create, or task-assignment) */}
      {viewMode === 'details' && (
        <div className={styles['page-header']}>
          <h1>{t('objects.title') || 'Object Details'}</h1>
          <button
            className={`${styles['btn']} ${styles['btn-secondary']}`}
            onClick={handleBackToList}
          >
            ← {t('common.actions.backToList') || 'Back to List'}
          </button>
        </div>
      )}

      {/* Main content */}
      <div className={styles['page-content']}>
        {viewMode === 'list' && (
          <ObjectsList
            onObjectSelect={handleObjectSelect}
            showCreate={true}
            onCreateClick={handleCreateObject}
          />
        )}

        {viewMode === 'details' && selectedObject && (
          <ObjectDetails
            objectId={selectedObject.id}
            onTaskCreate={handleCreateTask}
            onTaskSelect={handleTaskSelect}
          />
        )}

        {viewMode === 'task-assignment' && selectedObject && (
          <div className={styles['modal-overlay']}>
            <TaskAssignment
              objectId={selectedObject.id}
              taskId={selectedTask?.id}
              onSuccess={handleTaskAssignmentSuccess}
              onCancel={handleTaskAssignmentCancel}
            />
          </div>
        )}
        {viewMode === 'create' && (
          <div className={styles['modal-overlay']}>
            <ObjectCreateForm
              onSuccess={handleObjectCreated}
              onCancel={handleBackToList}
            />
          </div>
        )}      </div>
    </div>
  );
};
