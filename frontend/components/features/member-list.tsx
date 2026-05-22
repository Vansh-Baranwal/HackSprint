'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { FederationMember, MembershipStatus } from '@/types';

interface MemberListProps {
  members: FederationMember[];
  onRemove: (member: FederationMember) => void;
  onAddMember: () => void;
}

const statusColors: Record<MembershipStatus, 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  REVOKED: 'error',
};

export function MemberList({ members, onRemove, onAddMember }: MemberListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredMembers = members.filter((member) =>
    statusFilter === 'all' ? true : member.status === statusFilter
  );

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (member: FederationMember) =>
        member.user ? `${member.user.firstName} ${member.user.lastName}` : 'N/A',
    },
    {
      key: 'email',
      label: 'Email',
      render: (member: FederationMember) => member.user?.email || 'N/A',
    },
    {
      key: 'role',
      label: 'Role',
      render: (member: FederationMember) => member.role.replace(/_/g, ' '),
    },
    {
      key: 'status',
      label: 'Status',
      render: (member: FederationMember) => (
        <Badge variant={statusColors[member.status]}>{member.status}</Badge>
      ),
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      render: (member: FederationMember) =>
        new Date(member.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (member: FederationMember) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemove(member)}
          disabled={member.role === 'OWNER'}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'REVOKED', label: 'Revoked' },
            ]}
          />
        </div>
        <Button onClick={onAddMember}>Add Member</Button>
      </div>

      <Table
        data={filteredMembers}
        columns={columns}
        emptyMessage="No members found"
      />
    </div>
  );
}
