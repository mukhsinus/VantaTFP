import React, { useState, useEffect, useRef } from 'react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/employees', { params: { limit: 100 } });
      return res.data;
    },
    staleTime: 60000,
  });
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
      setSearchTerm('');
      setShowDropdown(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleAssign = () => {
    if (selectedUserId) {
      assignMutation.mutate();
    }
  };

  const employees = employeesData?.data || [];
  const assignedEmployees = assignedResponse?.employees || [];
  const assignedUserIds = new Set(assignedEmployees.map((e: ObjectEmployee) => e.user_id));
  const assignedMap = new Map(assignedEmployees.map((e: ObjectEmployee) => [e.user_id, e]));

  // Show all employees, but filter by search term
  const filteredEmployees = employees.filter((emp: Employee) => {
    const matchesSearch = searchTerm
      ? `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesSearch;
  });

  const handleSelectEmployee = (empId: string, firstName: string, lastName: string) => {
    setSelectedUserId(empId);
    setSearchTerm(`${firstName} ${lastName}`);
    setShowDropdown(false);
    
    // If already assigned, set role to current role; otherwise default
    const existing = assignedMap.get(empId);
    if (existing) {
      setSelectedRole(existing.role);
    } else {
      setSelectedRole('worker');
    }
  };

  const selectedEmployee = assignedMap.get(selectedUserId);
  const isReassigning = selectedUserId && selectedEmployee;

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
          <div className={styles['form-group']} ref={dropdownRef} style={{ position: 'relative' }}>
            <label htmlFor="employee-search">
              {isReassigning ? 'Change Employee Role' : 'Select Employee'}
            </label>
            <input
              id="employee-search"
              type="text"
              placeholder={employeesLoading ? 'Loading...' : 'Search employee...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className={styles['input']}
            />
            {showDropdown && filteredEmployees.length > 0 && (
              <div className={styles['employee-dropdown']}>
                {filteredEmployees.slice(0, 8).map((emp: Employee) => {
                  const isAssigned = assignedUserIds.has(emp.id);
                  const currentRole = assignedMap.get(emp.id)?.role;
                  return (
                    <button
                      key={emp.id}
                      className={styles['dropdown-item']}
                      onClick={() =>
                        handleSelectEmployee(emp.id, emp.first_name, emp.last_name)
                      }
                      style={{
                        opacity: isAssigned ? 0.7 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <span>
                          {emp.first_name} {emp.last_name}
                        </span>
                        {isAssigned && (
                          <Badge variant="secondary" style={{ marginLeft: '0.5rem' }}>
                            {currentRole}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
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
            {isReassigning ? 'Update Role' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  );
};
