'use client';

import React, { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { ProfileForm } from '@/components/forms/profile-form';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { AthleteProfile } from '@/types';
import type { AthleteProfileFormData } from '@/lib/validations/profile';

export default function ProfilePage() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient.get<AthleteProfile>('/athlete-profiles/me');
        setProfile(data);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          error('Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [error]);

  const handleSubmit = async (data: AthleteProfileFormData) => {
    try {
      if (profile) {
        const updated = await apiClient.patch<AthleteProfile>(`/athlete-profiles/${profile.id}`, data);
        setProfile(updated);
        success('Profile updated successfully');
      } else {
        const created = await apiClient.post<AthleteProfile>('/athlete-profiles', data);
        setProfile(created);
        success('Profile created successfully');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save profile');
      throw err;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Athlete Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your personal information and sport details
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <ProfileForm
                initialData={profile ? {
                  dateOfBirth: profile.dateOfBirth,
                  gender: profile.gender,
                  nationality: profile.nationality,
                  primarySport: profile.primarySport,
                  clubName: profile.clubName,
                  metadata: profile.metadata,
                } : undefined}
                onSubmit={handleSubmit}
              />
            </CardBody>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
