'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { UserRole } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User } from 'lucide-react';

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  error?: string;
}

const roleOptions: SelectOption[] = [
  { value: UserRole.ATHLETE, label: 'Athlete - Create profile and request verification' },
  { value: UserRole.COACH, label: 'Coach - Manage athlete profiles' },
  { value: UserRole.FEDERATION, label: 'Federation - Verify athletes and issue credentials' },
  { value: UserRole.ADMIN, label: 'Administrator - System-wide access' },
  { value: UserRole.INVESTIGATOR, label: 'Investigator - Handle abuse reports' },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, error: externalError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  React.useEffect(() => {
    if (!password) {
      setPasswordStrength('weak');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 12;

    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(Boolean).length;

    if (strengthScore <= 2) {
      setPasswordStrength('weak');
    } else if (strengthScore <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);

  const handleFormSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {(externalError || errors.root) && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          role="alert"
        >
          {externalError || errors.root?.message}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="First Name"
          type="text"
          placeholder="John"
          icon={<User className="h-5 w-5" />}
          error={errors.firstName?.message}
          disabled={isLoading}
          required
          {...register('firstName')}
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
          icon={<User className="h-5 w-5" />}
          error={errors.lastName?.message}
          disabled={isLoading}
          required
          {...register('lastName')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        icon={<Mail className="h-5 w-5" />}
        error={errors.email?.message}
        disabled={isLoading}
        required
        {...register('email')}
      />

      <div>
        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          icon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          disabled={isLoading}
          required
          {...register('password')}
        />
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full transition-all duration-300 ${strengthColors[passwordStrength]}`}
                  style={{
                    width:
                      passwordStrength === 'weak'
                        ? '33%'
                        : passwordStrength === 'medium'
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          </div>
        )}
      </div>

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        icon={<Lock className="h-5 w-5" />}
        error={errors.confirmPassword?.message}
        disabled={isLoading}
        required
        {...register('confirmPassword')}
      />

      <Select
        label="Role"
        options={roleOptions}
        error={errors.role?.message}
        disabled={isLoading}
        required
        value={watch('role')}
        onChange={(value) => setValue('role', value as UserRole, { shouldValidate: true })}
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign in here
        </Link>
      </p>
    </form>
  );
};
