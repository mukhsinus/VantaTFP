import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@shared/api/client';
import { Button, Badge, Input } from '@shared/components/ui';
import styles from '../objects.module.css';

interface EmployeeAssignmentProps {
  objectId: string;
  onSuccess?: () => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface ObjectEmployee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_at: string;
}

export const EmployeeAssignment: React.FC<EmployeeAssignmentProps> = ({
  objectId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('worker');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/employees', { params: { limit: 100 } });
      return res.data;
    },
    staleTime: 60000,
  });

  // Fetch assigned employees
  const { data: assignedResponse, refetch: refetchAssigned } = useQuery({
    queryKey: ['object-employees', objectId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/objects/${objectId}/employees`);
      return res.data;
    },
    staleTime: 30000,
  });

  // Assign employee mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await apiClient.post(
        `/api/v1/objects/${objectId}/employees/${selectedUserId}`,
        { role: selectedRole }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-employees', objectId] });
      setSelectedUserId('');
      setSelectedRole('worker');
      onSuccess?.();
    },
  });

  // Remove employee mutation
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(
        `/api/v1/objects/${objectId}/employees/${userId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-employees', objectId] });
      refetchAssigned();
    },
  });

  const handleAssign = () => {
    if (selectedUserId) {
      assignMutation.mutate();
    }
  };

  const employees = employeesData?.data || [];
  const assignedEmployees = assignedResponse?.employees || [];
  const assignedUserIds = new Set(assignedEmployees.map((e: ObjectEmployee) => e.user_id));

  const availableEmployees = employees.filter((emp: Employee) => {
    const isAssigned = assignedUserIds.has(emp.id);
    const matchesSearch = searchTerm
      ? `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return !isAssigned && matchesSearch;
  });

  return (
    <div className={styles['employee-assignment']}>
      <h3>{t('objects.labels.assignEmployees') || 'Assign Employees'}</h3>

      {/* Assigned Employees */}
      <div className={styles['assigned-employees']}>
        {assignedEmployees.length > 0 ? (
          <div className={styles['employee-list']}>
            {assignedEmployees.map((emp: ObjectEmployee) => (
              <div key={emp.id} className={styles['employee-item']}>
                <div className={styles['employee-info']}>
                  <p className={styles['employee-name']}>
                    {emp.first_name} {emp.last_name}
                  </p>
                  <Badge variant="secondary">{emp.role}</Badge>
                </div>
                <button
                  className={styles['btn-remove']}
                  onClick={() => removeMutation.mutate(emp.user_id)}
                  disabled={removeMutation.isPending}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles['empty-message']}>No employees assigned yet</p>
        )}
      </div>

      {/* Assignment Form */}
      <div className={styles['assignment-form']}>
        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="employee-search">Select Employee</label>
            <input
              id="employee-search"
              type="text"
              placeholder="Search or select..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles['input']}
            />
            {availableEmployees.length > 0 && (
              <div className={styles['employee-dropdown']}>
                {availableEmployees.slice(0, 5).map((emp: Employee) => (
                  <button
                    key={emp.id}
                    className={styles['dropdown-item']}
                    onClick={() => {
                      setSelectedUserId(emp.id);
                      setSearchTerm(`${emp.first_name} ${emp.last_name}`);
                    }}
                  >
                    {emp.first_name} {emp.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="role-select">Role</label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={styles['input']}
            >
              <option value="worker">Worker</option>
              <option value="supervisor">Supervisor</option>
              <option value="inspector">Inspector</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedUserId || assignMutation.isPending}
            style={{ alignSelf: 'flex-end' }}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};
