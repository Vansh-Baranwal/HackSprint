'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { ReportCard } from '@/components/features/report-card';
import { ReportDetails } from '@/components/features/report-details';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { AbuseReport, ReportStatus, ReportSeverity } from '@/types';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  const { success, error } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, statusFilter, severityFilter]);

  const fetchReports = async () => {
    try {
      const data = await apiClient.get<AbuseReport[]>('/admin/reports');
      setReports(data);
    } catch (err: any) {
      error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((r) => r.severity === severityFilter);
    }

    setFilteredReports(filtered);
  };

  const handleViewDetails = (report: AbuseReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleUpdateReport = async (reportId: string, updates: any) => {
    try {
      await apiClient.patch(`/admin/reports/${reportId}`, updates);
      success('Report updated successfully');
      fetchReports();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update report');
      throw err;
    }
  };

  const metrics = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'TRIAGED').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length,
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Report Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and investigate abuse reports
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {metrics.total}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
              {metrics.pending}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {metrics.resolved}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'TRIAGED', label: 'Triaged' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'INVESTIGATING', label: 'Investigating' },
                { value: 'ESCALATED', label: 'Escalated' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
            <Select
              label="Severity"
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value)}
              options={[
                { value: 'all', label: 'All Severities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No reports found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {selectedReport && (
          <>
            <Modal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              title="Report Details"
              size="xl"
            >
              <ReportDetails
                report={selectedReport}
                onUpdate={handleUpdateReport}
              />
            </Modal>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
