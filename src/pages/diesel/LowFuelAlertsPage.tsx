import React, { useEffect, useState } from 'react';
import { useFuel } from '@/hooks/useFuel';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatNumber } from '@/utils/formatters';
import { FiDroplet, FiAlertTriangle, FiMapPin } from 'react-icons/fi';

const LowFuelAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState('25');
  const { getLowFuelAlerts } = useFuel();
  const { error: showError } = useNotification();

  useEffect(() => {
    loadAlerts();
  }, [threshold]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await getLowFuelAlerts(parseInt(threshold));
      setAlerts(result.data);
    } catch (err) {
      showError('Failed to load fuel alerts');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, any> = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'gray',
    };
    return colors[urgency] || 'gray';
  };
  // Group by urgency
  const groupedAlerts = {
    critical: alerts.filter((a) => a.urgency === 'critical'),
    high: alerts.filter((a) => a.urgency === 'high'),
    medium: alerts.filter((a) => a.urgency === 'medium'),
    low: alerts.filter((a) => a.urgency === 'low'),
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
        <h1 className="text-2xl font-bold text-gray-900">Low Fuel Alerts</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Threshold:</span>
          <Select
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            options={[
              { value: '10', label: '<10%' },
              { value: '25', label: '<25%' },
              { value: '50', label: '<50%' },
            ]}
            className="w-32"
          />
          <Badge variant="red">{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-2xl font-bold text-red-600">{groupedAlerts.critical.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">High</p>
            <p className="text-2xl font-bold text-orange-600">{groupedAlerts.high.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Medium</p>
            <p className="text-2xl font-bold text-yellow-600">{groupedAlerts.medium.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Low</p>
            <p className="text-2xl font-bold text-gray-600">{groupedAlerts.low.length}</p>
          </div>
        </Card>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={<FiDroplet className="h-16 w-16 text-green-400" />}
          title="No low fuel alerts"
          description="All sites have sufficient fuel levels"
        />
      ) : (
        <>
          {/* Critical Alerts */}
          {groupedAlerts.critical.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <FiAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Critical Alerts ({groupedAlerts.critical.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedAlerts.critical.map((alert) => (
                  <Card key={alert.site_id} className="border-2 border-red-500">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{alert.site_name}</h3>
                          <p className="text-sm text-gray-500">{alert.site_id}</p>
                        </div>
                        <Badge variant="red">{alert.urgency}</Badge>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Fuel Level</span>
                          <span className="font-bold text-red-600">{alert.fuel_percentage}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${alert.fuel_percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Current</p>
                          <p className="font-medium">{formatNumber(alert.fuel_level)} L</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Capacity</p>
                          <p className="font-medium">{formatNumber(alert.tank_capacity)} L</p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="mr-2 h-4 w-4" />
                        {alert.region} • {alert.cluster}
                      </div>

                      <div className="text-sm">
                        <span className="text-gray-500">Technician:</span>
                        <span className="ml-2 font-medium">{alert.technician}</span>
                      </div>

                      <div className="text-xs text-gray-500">
                        Last updated: {formatDate(alert.last_updated)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* High Priority Alerts */}
          {groupedAlerts.high.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                High Priority ({groupedAlerts.high.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedAlerts.high.map((alert) => (
                  <Card key={alert.site_id} className="border-l-4 border-orange-500">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{alert.site_name}</h3>
                          <p className="text-sm text-gray-500">{alert.site_id}</p>
                        </div>
                        <Badge variant="orange">{alert.fuel_percentage}%</Badge>
                      </div>

                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${alert.fuel_percentage}%` }}
                        />
                      </div>

                      <div className="text-sm text-gray-600">
                        {formatNumber(alert.fuel_level)} L / {formatNumber(alert.tank_capacity)} L
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Medium & Low Priority (collapsed view) */}
          {(groupedAlerts.medium.length > 0 || groupedAlerts.low.length > 0) && (
            <div className="space-y-4">
              {groupedAlerts.medium.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-2">
                    Medium Priority ({groupedAlerts.medium.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedAlerts.medium.slice(0, 5).map((alert) => (
                      <div key={alert.site_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{alert.site_name}</span>
                        <Badge variant="yellow" size="sm">{alert.fuel_percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LowFuelAlertsPage;