import React, { useState } from 'react';
import { ObjectsList } from './ObjectsList';
import { ObjectDetails } from './ObjectDetails';
import { TaskAssignment } from './TaskAssignment';
import { ObjectCreateForm } from './ObjectCreateForm';

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
        <div className="page-header">
          <h1>Object Details</h1>
          <button
            className="btn btn-secondary"
            onClick={handleBackToList}
          >
            ← Back to List
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="page-content">
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
          <div className="modal-overlay">
            <TaskAssignment
              objectId={selectedObject.id}
              taskId={selectedTask?.id}
              onSuccess={handleTaskAssignmentSuccess}
              onCancel={handleTaskAssignmentCancel}
            />
          </div>
        )}
        {viewMode === 'create' && (
          <div className="modal-overlay">
            <ObjectCreateForm
              onSuccess={handleObjectCreated}
              onCancel={handleBackToList}
            />
          </div>
        )}      </div>
    </div>
  );
};
