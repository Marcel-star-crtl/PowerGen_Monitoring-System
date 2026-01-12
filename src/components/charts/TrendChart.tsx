import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    value: number;
    secondaryValue?: number;
  }>;
  height?: number;
  type?: 'line' | 'bar' | 'combo';
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  height = 300,
  type = 'line',
  primaryLabel = 'Value',
  secondaryLabel = 'Secondary',
  primaryColor = '#3b82f6',
  secondaryColor = '#22c55e',
}) => {
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill={primaryColor} name={primaryLabel} />
          {data[0]?.secondaryValue !== undefined && (
            <Bar dataKey="secondaryValue" fill={secondaryColor} name={secondaryLabel} />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'combo') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="value" fill={primaryColor} name={primaryLabel} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="secondaryValue"
            stroke={secondaryColor}
            name={secondaryLabel}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={primaryColor}
          name={primaryLabel}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        {data[0]?.secondaryValue !== undefined && (
          <Line
            type="monotone"
            dataKey="secondaryValue"
            stroke={secondaryColor}
            name={secondaryLabel}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
