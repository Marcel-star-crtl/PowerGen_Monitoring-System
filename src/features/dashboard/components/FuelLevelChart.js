// import React from 'react';
// import { Bar } from 'react-chartjs-2';
// import { Card } from 'antd';

// const FuelLevelChart = ({ data }) => {
//   const chartData = {
//     labels: data.map(item => item.model),
//     datasets: [
//       {
//         label: 'Fuel Level (%)',
//         data: data.map(item => item.fuel_level),
//         backgroundColor: '#FFA500',
//       },
//     ],
//   };

//   return (
//     <div style={{ height: '300px' }}>
//       <Bar
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           responsive: true,
//           scales: {
//             y: {
//               beginAtZero: true,
//               max: 100,
//             },
//           },
//         }}
//       />
//     </div>
//   );
// };

// export default FuelLevelChart;





import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FuelLevelChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.model),
    datasets: [
      {
        label: 'Fuel Level (%)',
        data: data.map(item => item.fuel_level),
        backgroundColor: '#FFA500',
      },
    ],
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar
        data={chartData}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
        }}
      />
    </div>
  );
};

export default FuelLevelChart;







// import React from 'react';
// import { Bar } from 'react-chartjs-2';
// import { Card, Tag } from 'antd';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const FuelLevelChart = ({ data, isSimulated }) => {
//   const chartData = {
//     labels: data.map(item => `${item.model} (${item._id.slice(0, 6)}...)`),
//     datasets: [{
//       label: 'Fuel Level (%)',
//       data: data.map(item => item.current_stats.fuel),
//       backgroundColor: data.map(item => 
//         item.current_stats.fuel < 20 ? '#FFA500' : '#36A2EB'
//       ),
//       borderColor: isSimulated ? '#7B1FA2' : '#ffffff',
//       borderWidth: isSimulated ? 2 : 1
//     }]
//   };

//   return (
//     <div style={{ position: 'relative', height: '300px' }}>
//       <Bar
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           responsive: true,
//           scales: {
//             y: {
//               beginAtZero: true,
//               max: 100,
//               title: {
//                 display: true,
//                 text: 'Fuel Level (%)'
//               }
//             }
//           },
//           plugins: {
//             tooltip: {
//               callbacks: {
//                 label: (context) => {
//                   return `${context.dataset.label}: ${context.raw}%`;
//                 }
//               }
//             }
//           }
//         }}
//       />
//       {isSimulated && (
//         <div style={{ position: 'absolute', top: 10, right: 10 }}>
//           <Tag color="purple">Simulation</Tag>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FuelLevelChart;