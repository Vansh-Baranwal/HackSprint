'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { MemberList } from '@/components/features/member-list';
import { AddMemberForm } from '@/components/features/add-member-form';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { FederationMember, FederationMemberRole } from '@/types';

export default function FederationMembersPage() {
  const [members, setMembers] = useState<FederationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<FederationMember | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { success, error } = useToast();

  async function fetchMembers() {
    try {
      const data = await apiClient.get<FederationMember[]>('/federation/members');
      setMembers(data);
    } catch {
      error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (data: {
    email: string;
    role: FederationMemberRole;
    message: string;
  }) => {
    try {
      const newMember = await apiClient.post<FederationMember>('/federation/members', data);
      setMembers((prev) => [...prev, newMember]);
      success('Invitation sent successfully');
      setShowAddForm(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add member');
      throw err;
    }
  };

  const handleRemoveMember = (member: FederationMember) => {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await apiClient.delete(`/federation/members/${memberToRemove.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      success('Member removed successfully');
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Federation Members
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your federation's team members and their roles
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {showAddForm && (
              <AddMemberForm
                onSubmit={handleAddMember}
              />
            )}

            <MemberList
              members={members}
              onRemove={handleRemoveMember}
              onAddMember={() => setShowAddForm(!showAddForm)}
            />
          </>
        )}

        <Modal
          isOpen={showRemoveConfirm}
          onClose={() => {
            setShowRemoveConfirm(false);
            setMemberToRemove(null);
          }}
          title="Remove Member"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to remove{' '}
              <span className="font-semibold">
                {memberToRemove?.user
                  ? `${memberToRemove.user.firstName} ${memberToRemove.user.lastName}`
                  : 'this member'}
              </span>{' '}
              from your federation?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone. They will lose access to all federation resources.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setMemberToRemove(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmRemoveMember}>
                Remove Member
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
