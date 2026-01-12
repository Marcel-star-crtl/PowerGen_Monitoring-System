import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConsumptionChartProps {
  data: Array<{
    date: string;
    consumed: number;
    rate?: number;
  }>;
  height?: number;
  showRate?: boolean;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  data,
  height = 300,
  showRate = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" label={{ value: 'Liters', angle: -90, position: 'insideLeft' }} />
        {showRate && (
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'L/h', angle: 90, position: 'insideRight' }}
          />
        )}
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="consumed"
          stroke="#3b82f6"
          name="Consumed (L)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        {showRate && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rate"
            stroke="#22c55e"
            name="Rate (L/h)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};