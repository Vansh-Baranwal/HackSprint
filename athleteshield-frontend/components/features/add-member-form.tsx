'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FederationMemberRole } from '@/types';

interface AddMemberFormProps {
  onSubmit: (data: { email: string; role: FederationMemberRole; message: string }) => Promise<void>;
}

export function AddMemberForm({ onSubmit }: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FederationMemberRole>(FederationMemberRole.VERIFIER);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ email: email.trim(), role, message: message.trim() });
      setEmail('');
      setRole(FederationMemberRole.VERIFIER);
      setMessage('');
      setErrors({});
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Add New Member
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="member@example.com"
          error={errors.email}
          required
        />

        <Select
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as FederationMemberRole);
            setErrors((prev) => ({ ...prev, role: '' }));
          }}
          options={[
            { value: FederationMemberRole.VERIFIER, label: 'Verifier - Can review verification requests' },
            { value: FederationMemberRole.ADMIN, label: 'Admin - Can manage members and settings' },
            { value: FederationMemberRole.COACH, label: 'Coach - Can view athlete information' },
            { value: FederationMemberRole.INVESTIGATOR, label: 'Investigator - Can handle reports' },
          ]}
          error={errors.role}
          required
        />

        <Textarea
          label="Invitation Message (Optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message to the invitation email..."
          rows={3}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Card>
  );
}
