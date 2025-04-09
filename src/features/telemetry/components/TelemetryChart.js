// import React from 'react';
// import { Line } from 'react-chartjs-2';

// const TelemetryChart = ({ data, loading }) => {
//   if (loading || !data || data.length === 0) {
//     return <div>Loading chart data...</div>;
//   }

//   const chartData = {
//     labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
//     datasets: [
//       {
//         label: 'Fuel Level (%)',
//         data: data.map(item => item.fuel_level),
//         borderColor: 'rgb(75, 192, 192)',
//         tension: 0.1,
//       },
//       {
//         label: 'Power Output (kW)',
//         data: data.map(item => item.power_output),
//         borderColor: 'rgb(53, 162, 235)',
//         tension: 0.1,
//       },
//     ],
//   };

//   return (
//     <div style={{ height: '400px' }}>
//       <Line
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           responsive: true,
//         }}
//       />
//     </div>
//   );
// };

// export default TelemetryChart;







import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TelemetryChart = ({ data, loading }) => {
  if (loading || !data || data.length === 0) {
    return <div>Loading chart data...</div>;
  }

  const chartData = {
    labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Fuel Level (%)',
        data: data.map(item => item.fuel_level),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Power Output (kW)',
        data: data.map(item => item.power_output),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div style={{ height: '400px' }}>
      <Line
        data={chartData}
        options={{
          maintainAspectRatio: false,
          responsive: true,
        }}
      />
    </div>
  );
};

export default TelemetryChart;





// Updated with simulation data
// import React from 'react';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import { Badge } from 'antd';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const TelemetryChart = ({ data, loading, showEvents = false }) => {
//   if (loading || !data || data.length === 0) {
//     return <div>Loading chart data...</div>;
//   }

//   const chartData = {
//     labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
//     datasets: [
//       {
//         label: 'Fuel Level (%)',
//         data: data.map(item => item.fuel_level),
//         borderColor: 'rgb(75, 192, 192)',
//         backgroundColor: 'rgba(75, 192, 192, 0.5)',
//         tension: 0.1,
//         yAxisID: 'y',
//       },
//       {
//         label: 'Power Output (kW)',
//         data: data.map(item => item.power_output),
//         borderColor: 'rgb(53, 162, 235)',
//         backgroundColor: 'rgba(53, 162, 235, 0.5)',
//         tension: 0.1,
//         yAxisID: 'y1',
//       },
//       {
//         label: 'Temperature (°C)',
//         data: data.map(item => item.temperature),
//         borderColor: 'rgb(255, 99, 132)',
//         backgroundColor: 'rgba(255, 99, 132, 0.5)',
//         tension: 0.1,
//         yAxisID: 'y2',
//       },
//     ],
//   };

//   // Add event annotations if showing simulated data
//   const eventAnnotations = showEvents ? {
//     annotations: data
//       .filter(item => item.event_type !== 'normal')
//       .map((item, index) => ({
//         type: 'line',
//         mode: 'vertical',
//         scaleID: 'x',
//         value: new Date(item.timestamp).toLocaleTimeString(),
//         borderColor: getEventColor(item.event_type),
//         borderWidth: 2,
//         label: {
//           content: item.event_type.replace('_', ' '),
//           enabled: true,
//           position: 'top',
//           backgroundColor: getEventColor(item.event_type),
//         }
//       }))
//   } : {};

//   function getEventColor(eventType) {
//     switch(eventType) {
//       case 'low_fuel': return 'gold';
//       case 'overheating': return 'red';
//       case 'mechanical_issue': return 'orange';
//       default: return 'blue';
//     }
//   }

//   return (
//     <div style={{ height: '400px', position: 'relative' }}>
//       {showEvents && (
//         <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}>
//           <Badge color="gold" text="Low Fuel" style={{ marginRight: 8 }} />
//           <Badge color="red" text="Overheating" style={{ marginRight: 8 }} />
//           <Badge color="orange" text="Mechanical Issue" />
//         </div>
//       )}
//       <Line
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           responsive: true,
//           scales: {
//             y: {
//               type: 'linear',
//               display: true,
//               position: 'left',
//               title: { display: true, text: 'Fuel Level (%)' },
//               min: 0,
//               max: 100
//             },
//             y1: {
//               type: 'linear',
//               display: true,
//               position: 'right',
//               title: { display: true, text: 'Power Output (kW)' },
//               grid: { drawOnChartArea: false },
//             },
//             y2: {
//               type: 'linear',
//               display: false,
//               min: 0,
//               max: 120
//             }
//           },
//           plugins: {
//             ...eventAnnotations,
//             tooltip: {
//               callbacks: {
//                 label: function(context) {
//                   let label = context.dataset.label || '';
//                   if (label) {
//                     label += ': ';
//                   }
//                   if (context.parsed.y !== null) {
//                     label += context.parsed.y;
//                   }
//                   return label;
//                 }
//               }
//             }
//           }
//         }}
//       />
//     </div>
//   );
// };

// export default TelemetryChart;