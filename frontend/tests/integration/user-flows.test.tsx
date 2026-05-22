import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/login-form';
import { ProfileForm } from '@/components/forms/profile-form';
import { DocumentUpload } from '@/components/features/document-upload';
import { AbuseReportForm } from '@/components/features/abuse-report-form';
import { VerificationRequestForm } from '@/components/features/verification-request-form';
import { ReportTrackingForm } from '@/components/features/report-tracking-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import '@testing-library/jest-dom';

// ─── Auth Flow ──────────────────────────────────────────────────────────────

describe('Auth Flow Integration', () => {
  it('login form -> validation -> submission', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockSubmit} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('login form validates required fields', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});

// ─── Athlete Flow ──────────────────────────────────────────────────────────

describe('Athlete Portal Flow', () => {
  it('profile form -> loads data -> shows privacy notice', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileForm
        initialData={{
          dateOfBirth: '2000-01-15',
          gender: 'male',
          nationality: 'United States',
          primarySport: 'Athletics',
          clubName: 'City AC',
          metadata: {},
        }}
        onSubmit={mockSubmit}
      />
    );

    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Sport Details')).toBeInTheDocument();
    expect(screen.getByText(/privacy notice/i)).toBeInTheDocument();
  });

  it('document upload -> renders encryption notice', () => {
    const mockUpload = vi.fn();
    render(<DocumentUpload onUpload={mockUpload} />);

    const uploadHeadings = screen.getAllByText(/upload document/i);
    expect(uploadHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText(/encryption notice/i)).toBeInTheDocument();
  });

  it('verification request form -> renders with documents', () => {
    const mockSubmit = vi.fn();
    render(
      <VerificationRequestForm
        documents={[]}
        onSubmit={mockSubmit}
      />
    );

    expect(screen.getByText(/request verification/i)).toBeInTheDocument();
  });
});

// ─── Public Flow ───────────────────────────────────────────────────────────

describe('Public Features Flow', () => {
  it('abuse report form -> shows privacy and anonymous options', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AbuseReportForm onSubmit={mockSubmit} />);

    expect(screen.getByText(/privacy notice/i)).toBeInTheDocument();
    expect(screen.getAllByText(/submit anonymously/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  it('report tracking form -> accepts tracking ID', async () => {
    const mockSubmit = vi.fn();
    render(<ReportTrackingForm onSubmit={mockSubmit} />);

    expect(screen.getByLabelText(/tracking id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /track report/i })).toBeInTheDocument();
  });
});

// ─── UI Component Integration ──────────────────────────────────────────────

describe('UI Component Integration', () => {
  it('button variants render correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-100');
  });

  it('input shows error state', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('modal opens and closes', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    const closeButton = screen.getByLabelText(/close modal/i);
    expect(closeButton).toBeInTheDocument();

    rerender(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('badge displays status text', () => {
    render(<Badge variant="success">APPROVED</Badge>);
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('loading spinner renders with aria label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('skeleton loader renders with aria label', () => {
    render(<SkeletonLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('card renders with children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('error boundary catches errors and shows fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const originalConsoleError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();

    console.error = originalConsoleError;
  });
});

// ─── Accessibility Integration ─────────────────────────────────────────────

describe('Accessibility Integration', () => {
  it('modal has correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('form inputs have associated labels', () => {
    render(
      <>
        <Input label="Full Name" id="name" />
        <Input label="Email" id="email" />
      </>
    );

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
