'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';

interface AbuseReportFormProps {
  onSubmit: (data: {
    description: string;
    incidentDate: string;
    location: string;
    involvedParties: string;
    evidenceFiles: File[];
    anonymous: boolean;
  }) => Promise<void>;
}

export function AbuseReportForm({ onSubmit }: AbuseReportFormProps) {
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [involvedParties, setInvolvedParties] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Incident description is required';
    }

    if (!incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        incidentDate,
        location: location.trim(),
        involvedParties: involvedParties.trim(),
        evidenceFiles,
        anonymous,
      });
      // Reset form
      setDescription('');
      setIncidentDate('');
      setLocation('');
      setInvolvedParties('');
      setEvidenceFiles([]);
      setAnonymous(false);
      setErrors({});
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Privacy Notice
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your report will be handled confidentially. If you choose to submit anonymously,
            your identity will not be shared with anyone. All reports are encrypted and stored
            securely.
          </p>
        </div>

        <Textarea
          label="Incident Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors((prev) => ({ ...prev, description: '' }));
          }}
          placeholder="Describe what happened in detail..."
          rows={6}
          error={errors.description}
          required
        />

        <Input
          label="Incident Date"
          type="date"
          value={incidentDate}
          onChange={(e) => {
            setIncidentDate(e.target.value);
            setErrors((prev) => ({ ...prev, incidentDate: '' }));
          }}
          error={errors.incidentDate}
          required
        />

        <Input
          label="Location (Optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where did this incident occur?"
        />

        <Textarea
          label="Involved Parties (Optional)"
          value={involvedParties}
          onChange={(e) => setInvolvedParties(e.target.value)}
          placeholder="Names or descriptions of people involved..."
          rows={3}
        />

        <FileUpload
          label="Evidence Files (Optional)"
          accept={{ "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "video/mp4": [".mp4"], "audio/mpeg": [".mp3"] }}
          multiple
          onFilesChange={setEvidenceFiles}
          maxSize={50 * 1024 * 1024} // 50MB
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="anonymous"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Submit anonymously (your identity will not be recorded)
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Card>
  );
}
