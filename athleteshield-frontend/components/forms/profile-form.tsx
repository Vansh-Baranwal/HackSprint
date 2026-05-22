'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { athleteProfileSchema, type AthleteProfileFormData } from '@/lib/validations/profile';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User, Globe, Trophy } from 'lucide-react';

export interface ProfileFormProps {
  initialData?: AthleteProfileFormData;
  onSubmit: (data: AthleteProfileFormData) => Promise<void>;
  isLoading?: boolean;
}

const genderOptions: SelectOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  isLoading: externalLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<AthleteProfileFormData>({
    resolver: zodResolver(athleteProfileSchema),
    defaultValues: initialData || {},
  });

  const handleFormSubmit = async (data: AthleteProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = externalLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Personal Information Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Personal Information
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your personal details for identity verification
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            disabled={isLoading}
            {...register('dateOfBirth')}
          />

          <Select
            label="Gender"
            options={genderOptions}
            error={errors.gender?.message}
            disabled={isLoading}
            value={watch('gender') || ''}
            onChange={(value) => setValue('gender', value, { shouldValidate: true, shouldDirty: true })}
          />

          <Input
            label="Nationality"
            type="text"
            placeholder="e.g., United States"
            icon={<Globe className="h-5 w-5" />}
            error={errors.nationality?.message}
            disabled={isLoading}
            {...register('nationality')}
          />
        </div>
      </div>

      {/* Sport Details Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sport Details
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Information about your athletic career
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="Primary Sport"
            type="text"
            placeholder="e.g., Athletics, Swimming"
            icon={<Trophy className="h-5 w-5" />}
            error={errors.primarySport?.message}
            disabled={isLoading}
            {...register('primarySport')}
          />

          <Input
            label="Club Name"
            type="text"
            placeholder="e.g., City Athletics Club"
            icon={<User className="h-5 w-5" />}
            error={errors.clubName?.message}
            disabled={isLoading}
            {...register('clubName')}
          />
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Privacy Notice:</strong> Your profile data is encrypted and stored securely. 
          Only you and authorized federations can access this information during verification processes.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isDirty || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
