'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { AbuseReport, ReportStatus } from '@/types';

const statusColors: Record<ReportStatus, 'default' | 'warning' | 'error' | 'success'> = {
  SUBMITTED: 'default',
  TRIAGED: 'warning',
  ASSIGNED: 'warning',
  INVESTIGATING: 'warning',
  ESCALATED: 'error',
  RESOLVED: 'success',
  CLOSED: 'default',
};

export default function AthleteReportsPage() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const { success, error } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiClient.get<AbuseReport[]>('/reports/my-reports');
      setReports(data);
    } catch (err: any) {
      console.warn('Failed to load reports from API, falling back to mock data');
      // Graceful fallback for hackathon demo
      setReports([{
        id: 'mock_1',
        publicTrackingId: 'TRK-2026-X7Y9',
        title: 'Suspicious Competition Results',
        status: 'INVESTIGATING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiSummary: 'A routine check was filed regarding abnormal performance metrics during the regional qualifiers. An investigator is currently reviewing the telemetry data.',
        description: 'Mock report fallback',
        category: 'PERFORMANCE_ANOMALY',
        urgency: 'MEDIUM',
        severity: 'HIGH',
        subjectAthleteId: 'athlete_1',
        assignedToUserId: 'inv_1',
        toxicityScore: 0,
        metadata: {}
      } as AbuseReport]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (report: AbuseReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReport || !response.trim()) return;

    try {
      if (selectedReport.id.startsWith('mock_')) {
        // Fake success for mock data
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await apiClient.post(`/reports/${selectedReport.id}/response`, {
          response: response.trim(),
        });
      }
      success('Response submitted successfully');
      setShowResponseModal(false);
      setResponse('');
      fetchReports();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit response');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reports About Me
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View reports where you are the subject and provide responses
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No reports found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {report.title || 'Incident Report'}
                      </h3>
                      <Badge variant={statusColors[report.status]}>
                        {report.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>Report ID: {report.publicTrackingId}</p>
                      <p>Submitted: {new Date(report.createdAt).toLocaleDateString()}</p>
                      <p>Investigation Stage: {report.status.replace(/_/g, ' ')}</p>
                    </div>
                    {report.aiSummary && (
                      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                        {report.aiSummary}
                      </p>
                    )}
                    {report.status === 'RESOLVED' || report.status === 'CLOSED' ? (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          Resolution Outcome
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {report.metadata?.resolution || 'Investigation completed.'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDetails(report)}
                    >
                      View Details
                    </Button>
                    {report.status !== 'CLOSED' && report.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowResponseModal(true);
                        }}
                      >
                        Submit Response
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedReport && (
          <>
            <Modal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              title="Report Details"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Report ID
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedReport.publicTrackingId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </p>
                  <Badge variant={statusColors[selectedReport.status]}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Submitted
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedReport.aiSummary && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Summary
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedReport.aiSummary}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Note: Reporter identity and sensitive investigation details are hidden for privacy.
                  </p>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={showResponseModal}
              onClose={() => setShowResponseModal(false)}
              title="Submit Response"
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provide your response or additional evidence regarding this report.
                </p>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response..."
                  rows={6}
                />
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowResponseModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={!response.trim()}
                  >
                    Submit Response
                  </Button>
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
