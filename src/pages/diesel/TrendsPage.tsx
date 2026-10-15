import React, { useEffect, useState } from 'react';
import { dieselManagerAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { PageHeader, Card, SectionLabel, KpiCard, Spinner } from '../../components/diesel/DieselComponents';
import { neutral, status as statusTokens, font } from '../../styles/dieselTokens';
import { formatNumber } from '@/utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendsPage: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const { error: showError } = useNotification();

  useEffect(() => {
    loadTrends();
  }, [period]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const data = await dieselManagerAPI.getConsumptionTrends(parseInt(period));
      setTrends(data.trends || []);
    } catch (err) {
      showError('Failed to load consumption trends');
    } finally {
      setLoading(false);
    }
  };

  const chartData = trends.map((item) => ({
    date: `${item._id.month}/${item._id.day}`,
    consumed: item.total_consumed,
    runtime: item.total_runtime,
    efficiency: item.avg_efficiency,
    sites: item.record_count,
  }));

  const totalConsumed = trends.reduce((sum, item) => sum + item.total_consumed, 0);
  const totalRuntime = trends.reduce((sum, item) => sum + item.total_runtime, 0);
  const avgEfficiency = trends.length > 0
    ? trends.reduce((sum, item) => sum + item.avg_efficiency, 0) / trends.length
    : 0;

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${neutral[200]}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 180, boxSizing: 'border-box',
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto', fontFamily: font.ui }}>
      <PageHeader
        title="📈 Consumption Trends"
        subtitle="Daily consumption, runtime, and efficiency over the selected period."
        actions={
          <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} style={selectStyle}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        }
      />

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Total Consumption" value={`${formatNumber(totalConsumed, 1)} L`} icon="⛽" />
        <KpiCard label="Total Runtime" value={`${formatNumber(totalRuntime, 1)} h`} icon="⏱️" />
        <KpiCard label="Avg Efficiency" value={`${formatNumber(avgEfficiency, 2)} L/h`} icon="📊" />
      </div>

      {/* Consumption Trend Chart */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Daily Consumption</SectionLabel>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={neutral[200]} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="consumed"
              stroke="#3b82f6"
              name="Consumed (L)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Runtime vs Consumption */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Runtime vs Consumption</SectionLabel>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={neutral[200]} />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="consumed" fill="#3b82f6" name="Consumed (L)" />
            <Bar yAxisId="right" dataKey="runtime" fill="#22c55e" name="Runtime (h)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Efficiency Trend */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Efficiency Trend (L/h)</SectionLabel>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={neutral[200]} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#f59e0b"
              name="Efficiency (L/h)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card>
        <SectionLabel>Key Insights</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {avgEfficiency > 0.35 && (
            <div style={{ padding: '10px 14px', background: statusTokens.warning.bg, borderLeft: `4px solid ${statusTokens.warning.border}`, borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: statusTokens.warning.text, margin: 0 }}>
                <strong>High consumption rate detected:</strong> Average efficiency is{' '}
                {formatNumber(avgEfficiency, 2)} L/h. Consider investigating potential issues.
              </p>
            </div>
          )}
          {avgEfficiency < 0.25 && (
            <div style={{ padding: '10px 14px', background: statusTokens.success.bg, borderLeft: `4px solid ${statusTokens.success.border}`, borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: statusTokens.success.text, margin: 0 }}>
                <strong>Excellent efficiency:</strong> Average consumption rate is{' '}
                {formatNumber(avgEfficiency, 2)} L/h. Generators are operating efficiently.
              </p>
            </div>
          )}
          <div style={{ padding: '10px 14px', background: statusTokens.info.bg, borderLeft: `4px solid ${statusTokens.info.border}`, borderRadius: 6 }}>
            <p style={{ fontSize: 13, color: statusTokens.info.text, margin: 0 }}>
              <strong>Period Summary:</strong> {formatNumber(totalConsumed, 1)}L consumed over{' '}
              {formatNumber(totalRuntime, 1)} hours across {trends.length} days.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrendsPage;
