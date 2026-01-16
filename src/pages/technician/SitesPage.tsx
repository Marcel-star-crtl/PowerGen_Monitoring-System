import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { technicianAPI } from '@/api';
import { Site } from '@/types/sites.types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { MultiStepVisitForm } from '@/components/forms/MultiStepVisit';
import { formatDate, calculateDaysSince } from '@/utils/helpers';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSites } from '@/hooks/useSites';
import { FiMapPin, FiCalendar, FiSearch } from 'react-icons/fi';

const TechnicianSites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { success, error: showError } = useNotification();
  const { submitVisit } = useSites();

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = sites.filter(
        (site) =>
          site.Site_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.IHS_ID_SITE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.Region?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSites(filtered);
    } else {
      setFilteredSites(sites);
    }
  }, [searchQuery, sites]);

  const loadSites = async () => {
    try {
      const { data } = await technicianAPI.getAssignedSites();
      setSites(data);
      setFilteredSites(data);
    } catch (error) {
      console.error('Failed to load sites:', error);
      showError('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const getDaysColor = (days: number | null) => {
    if (!days) return 'gray';
    if (days > 90) return 'red';
    if (days > 60) return 'orange';
    if (days > 30) return 'yellow';
    return 'green';
  };

  const handleSubmitClick = (site: Site) => {
    setSelectedSite(site);
    setShowSubmitModal(true);
  };

  const handleSubmitVisit = async (formData: any, photos: any[], submitNow: boolean) => {
    if (!selectedSite) return;

    setSubmitting(true);
    try {
      await submitVisit(selectedSite.IHS_ID_SITE, formData, photos, submitNow);

      if (submitNow) {
        success('Visit submitted for approval!');
      } else {
        success('Draft saved successfully!');
      }

      setShowSubmitModal(false);
      setSelectedSite(null);
      loadSites(); // Refresh the sites list
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Sites</h1>
        <Badge variant="blue">{filteredSites.length} Sites</Badge>
      </div>

      <Card>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search sites by name, ID, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            className="pl-10"
          />
        </div>
      </Card>

      {filteredSites.length === 0 ? (
        <EmptyState
          icon={<FiMapPin className="h-16 w-16 text-gray-400" />}
          title="No sites found"
          description={searchQuery ? 'Try adjusting your search query' : 'No sites assigned to you yet'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => {
            const daysSince = calculateDaysSince(site.Actual_Date_Visit);
            const needsVisit = !daysSince || daysSince > 90;

            return (
              <Card key={site.IHS_ID_SITE} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {site.Site_Name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500">{site.IHS_ID_SITE}</p>
                    </div>
                    {needsVisit && (
                      <Badge variant="red" size="sm">
                        Needs Visit
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{site.Region}</span>
                    </div>
                    {site.Actual_Date_Visit && (
                      <div className="flex items-center text-gray-600">
                        <FiCalendar className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Last: {formatDate(site.Actual_Date_Visit)}</span>
                      </div>
                    )}
                    {daysSince !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Days since visit:</span>
                        <Badge variant={getDaysColor(daysSince)} size="sm">
                          {daysSince} days
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSubmitClick(site)}
                    variant="primary"
                    fullWidth
                    size="sm"
                  >
                    Submit Visit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Visit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => {
          if (!submitting) {
            setShowSubmitModal(false);
            setSelectedSite(null);
          }
        }}
        title={`Submit Visit - ${selectedSite?.Site_Name || selectedSite?.IHS_ID_SITE}`}
        size="xl"
      >
        {selectedSite && (
          <div className="space-y-4">
            {/* Site Info Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Site ID</p>
                  <p className="font-medium">{selectedSite.IHS_ID_SITE}</p>
                </div>
                <div>
                  <p className="text-gray-500">Region</p>
                  <p className="font-medium">{selectedSite.Region}</p>
                </div>
              </div>
            </div>

            {/* Visit Form */}
            <MultiStepVisitForm
              siteDetails={selectedSite}
              initialData={{
                technician_id: user?.id || '',
                technician_name: user?.fullName || '',
                Actual_Date_Visit: new Date().toISOString().split('T')[0],
                Type_of_Visit: 'PM',
                priority: 'medium',
              }}
              onSubmit={handleSubmitVisit}
              loading={submitting}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TechnicianSites;

