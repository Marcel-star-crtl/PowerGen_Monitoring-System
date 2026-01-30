import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supervisorAPI } from '@/api';
import { sitesAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/formatters';
import { FiMapPin, FiPlus, FiEdit, FiEye, FiSearch, FiDownload } from 'react-icons/fi';

interface Site {
  _id: string;
  IHS_ID_SITE: string;
  Site_Name: string;
  Region?: string;
  GRATO_Cluster?: string;
  Sites_Priority?: string;
  Sites_Type?: string;
  Actual_Date_Visit?: string;
  Latitude?: number;
  Longitude?: number;
  status?: string;
}

const SupervisorSitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { success, error: showError } = useNotification();

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    filterSites();
  }, [sites, searchQuery, regionFilter, priorityFilter]);

  const loadSites = async () => {
    setLoading(true);
    try {
      const result = await supervisorAPI.getSites();
      setSites(result.data || []);
    } catch (err) {
      showError('Failed to load sites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterSites = () => {
    let filtered = [...sites];

    if (searchQuery) {
      filtered = filtered.filter(
        (site) =>
          site.Site_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.IHS_ID_SITE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.Region?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (regionFilter) {
      filtered = filtered.filter((site) => site.Region === regionFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((site) => site.Sites_Priority === priorityFilter);
    }

    setFilteredSites(filtered);
  };

  const handleViewDetails = (site: Site) => {
    // Navigate to detailed site page
    navigate(`/supervisor/sites/${site.IHS_ID_SITE}`);
  };

  const handleEdit = (site: Site) => {
    // Navigate to detailed site page (same as view)
    navigate(`/supervisor/sites/${site.IHS_ID_SITE}`);
  };

  const handleUpdateSite = async (data: any) => {
    if (!selectedSite) return;

    setSubmitting(true);
    try {
      await sitesAPI.updateSite(selectedSite.IHS_ID_SITE, data);
      success('Site updated successfully!');
      setShowEditModal(false);
      setSelectedSite(null);
      loadSites();
    } catch (err) {
      showError('Failed to update site');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const csv = generateCSV(filteredSites);
    downloadCSV(csv, 'sites-export.csv');
    success('Sites exported successfully!');
  };

  const generateCSV = (data: Site[]) => {
    const headers = ['Site ID', 'Site Name', 'Region', 'Cluster', 'Priority', 'Last Visit'];
    const rows = data.map((site) => [
      site.IHS_ID_SITE,
      site.Site_Name,
      site.Region || '',
      site.GRATO_Cluster || '',
      site.Sites_Priority || '',
      site.Actual_Date_Visit ? formatDate(site.Actual_Date_Visit) : 'Never',
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const regions = [...new Set(sites.map((s) => s.Region).filter(Boolean))];
  const priorities = [...new Set(sites.map((s) => s.Sites_Priority).filter(Boolean))];

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites Management</h1>
          <p className="text-gray-600 mt-1">View and manage all sites under your supervision</p>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <FiDownload className="mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiMapPin className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {sites.filter((s) => s.Sites_Priority === 'P1').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiMapPin className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regions</p>
              <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiMapPin className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSites.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiSearch className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search"
            placeholder="Search by name, ID, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            label="Region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={[
              { value: '', label: 'All Regions' },
              ...regions.map((r) => ({ value: r!, label: r! })),
            ]}
          />
          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Priorities' },
              ...priorities.map((p) => ({ value: p!, label: p! })),
            ]}
          />
        </div>
      </Card>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <EmptyState
          icon={<FiMapPin className="h-16 w-16 text-gray-400" />}
          title="No sites found"
          description="No sites match your current filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <Card key={site._id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{site.Site_Name}</h3>
                    <p className="text-sm text-gray-500">{site.IHS_ID_SITE}</p>
                  </div>
                  <Badge
                    variant={
                      site.Sites_Priority === 'P1'
                        ? 'red'
                        : site.Sites_Priority === 'P2'
                        ? 'yellow'
                        : 'gray'
                    }
                  >
                    {site.Sites_Priority || 'N/A'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Region</p>
                    <p className="font-medium">{site.Region || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cluster</p>
                    <p className="font-medium">{site.GRATO_Cluster || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Last Visit</p>
                    <p className="font-medium">
                      {site.Actual_Date_Visit ? formatDate(site.Actual_Date_Visit) : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDetails(site)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FiEye className="mr-2" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(site)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <FiEdit className="mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSite(null);
        }}
        title="Site Details"
        size="lg"
      >
        {selectedSite && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site ID</p>
                <p className="font-medium">{selectedSite.IHS_ID_SITE}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Site Name</p>
                <p className="font-medium">{selectedSite.Site_Name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-medium">{selectedSite.Region || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cluster</p>
                <p className="font-medium">{selectedSite.GRATO_Cluster || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <Badge
                  variant={
                    selectedSite.Sites_Priority === 'P1'
                      ? 'red'
                      : selectedSite.Sites_Priority === 'P2'
                      ? 'yellow'
                      : 'gray'
                  }
                >
                  {selectedSite.Sites_Priority || 'N/A'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Site Type</p>
                <p className="font-medium">{selectedSite.Sites_Type || 'N/A'}</p>
              </div>
              {selectedSite.Latitude && selectedSite.Longitude && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Latitude</p>
                    <p className="font-medium">{selectedSite.Latitude}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Longitude</p>
                    <p className="font-medium">{selectedSite.Longitude}</p>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Last Visit</p>
                <p className="font-medium">
                  {selectedSite.Actual_Date_Visit
                    ? formatDate(selectedSite.Actual_Date_Visit)
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedSite);
                }}
                variant="secondary"
              >
                Edit
              </Button>
              <Button onClick={() => setShowDetailsModal(false)} variant="primary">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !submitting && setShowEditModal(false)}
        title="Edit Site"
        size="lg"
      >
        {selectedSite && (
          <SiteEditForm
            site={selectedSite}
            onSubmit={handleUpdateSite}
            onCancel={() => setShowEditModal(false)}
            loading={submitting}
          />
        )}
      </Modal>
    </div>
  );
};

// Site Edit Form Component
const SiteEditForm: React.FC<{
  site: Site;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ site, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    Site_Name: site.Site_Name || '',
    Region: site.Region || '',
    GRATO_Cluster: site.GRATO_Cluster || '',
    Sites_Priority: site.Sites_Priority || '',
    Sites_Type: site.Sites_Type || '',
    Latitude: site.Latitude || '',
    Longitude: site.Longitude || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Site Name"
          value={formData.Site_Name}
          onChange={(e) => setFormData({ ...formData, Site_Name: e.target.value })}
          required
        />
        <Input
          label="Region"
          value={formData.Region}
          onChange={(e) => setFormData({ ...formData, Region: e.target.value })}
        />
        <Input
          label="Cluster"
          value={formData.GRATO_Cluster}
          onChange={(e) => setFormData({ ...formData, GRATO_Cluster: e.target.value })}
        />
        <Select
          label="Priority"
          value={formData.Sites_Priority}
          onChange={(e) => setFormData({ ...formData, Sites_Priority: e.target.value })}
          options={[
            { value: '', label: 'Select Priority' },
            { value: 'P1', label: 'P1 - High' },
            { value: 'P2', label: 'P2 - Medium' },
            { value: 'P3', label: 'P3 - Low' },
          ]}
        />
        <Input
          label="Site Type"
          value={formData.Sites_Type}
          onChange={(e) => setFormData({ ...formData, Sites_Type: e.target.value })}
        />
        <div />
        <Input
          label="Latitude"
          type="number"
          step="any"
          value={formData.Latitude}
          onChange={(e) => setFormData({ ...formData, Latitude: e.target.value })}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          value={formData.Longitude}
          onChange={(e) => setFormData({ ...formData, Longitude: e.target.value })}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Update Site
        </Button>
      </div>
    </form>
  );
};

export default SupervisorSitesPage;
