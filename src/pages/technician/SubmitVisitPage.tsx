import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { technicianAPI } from '@/api';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { Button } from '@/components/common/Button';
import { MultiStepVisitForm } from '@/components/forms/MultiStepVisit';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSites } from '@/hooks/useSites';
import { FiArrowLeft } from 'react-icons/fi';

const SubmitVisitPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();
  const { submitVisit } = useSites();

  useEffect(() => {
    if (siteId) {
      loadSite();
    }
  }, [siteId]);

  const loadSite = async () => {
    try {
      // Load the specific site details
      const { data } = await technicianAPI.getAssignedSites();
      const foundSite = data.find((s: any) => s.IHS_ID_SITE === siteId);
      setSite(foundSite);
    } catch (error) {
      showError('Failed to load site details');
      navigate('/technician/sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any, photos: any[], submitNow: boolean) => {
    if (!siteId) return;

    setSubmitting(true);
    try {
      await submitVisit(siteId, formData, photos, submitNow);

      if (submitNow) {
        success('Visit submitted for approval!');
        navigate('/technician/sites');
      } else {
        success('Draft saved successfully!');
        // Keep on page if draft or navigate to drafts?
        // navigate('/technician/drafts');
      }
    } catch (err) {
      showError('Failed to submit visit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Site not found</p>
        <Button onClick={() => navigate('/technician/sites')} variant="primary" className="mt-4">
          Back to Sites
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/technician/sites')}
            variant="ghost"
            size="sm"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submit Site Visit</h1>
            <p className="text-gray-600">{site.Site_Name} - {site.IHS_ID_SITE}</p>
          </div>
        </div>
      </div>

      <MultiStepVisitForm
        siteDetails={site}
        initialData={{
          technician_id: user?.id || '',
          technician_name: user?.fullName || '',
          Actual_Date_Visit: new Date().toISOString().split('T')[0],
          Type_of_Visit: 'PM',
          priority: 'medium',
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
};

export default SubmitVisitPage;

