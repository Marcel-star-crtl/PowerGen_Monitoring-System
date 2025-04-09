// import React from 'react';
// import { Pie } from 'react-chartjs-2';
// import { Card } from 'antd';

// const GeneratorStatusChart = ({ data }) => {
//   const chartData = {
//     labels: data.map(item => item.status),
//     datasets: [
//       {
//         data: data.map(item => item.count),
//         backgroundColor: [
//           '#4CAF50', // green for running
//           '#2196F3', // blue for standby
//           '#F44336', // red for fault
//           '#9E9E9E', // gray for others
//         ],
//       },
//     ],
//   };

//   return (
//     <div style={{ height: '300px' }}>
//       <Pie
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           responsive: true,
//         }}
//       />
//     </div>
//   );
// };

// export default GeneratorStatusChart;






import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Card } from 'antd';
import { 
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register required components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const GeneratorStatusChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#4CAF50', // green for running
          '#2196F3', // blue for standby
          '#F44336', // red for fault
          '#9E9E9E', // gray for others
        ],
      },
    ],
  };

  return (
    <div style={{ height: '300px' }}>
      <Pie
        data={chartData}
        options={{
          maintainAspectRatio: false,
          responsive: true,
        }}
      />
    </div>
  );
};

export default GeneratorStatusChart;








// import React from 'react';
// import { Pie } from 'react-chartjs-2';
// import { Card, Tag } from 'antd';
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend
// } from 'chart.js';

// ChartJS.register(ArcElement, Tooltip, Legend);

// const GeneratorStatusChart = ({ data, isSimulated }) => {
//   // Transform data for chart
//   const chartData = {
//     labels: data.map(item => item._id),
//     datasets: [{
//       data: data.map(item => item.count),
//       backgroundColor: [
//         '#4CAF50', // running
//         '#2196F3', // standby
//         '#F44336', // fault
//         '#9E9E9E'  // maintenance
//       ],
//       borderColor: isSimulated ? '#7B1FA2' : '#ffffff',
//       borderWidth: isSimulated ? 3 : 1
//     }]
//   };

//   return (
//     <div style={{ position: 'relative', height: '300px' }}>
//       <Pie
//         data={chartData}
//         options={{
//           maintainAspectRatio: false,
//           plugins: {
//             legend: { position: 'bottom' },
//             tooltip: {
//               callbacks: {
//                 label: (context) => {
//                   const total = context.dataset.data.reduce((a, b) => a + b, 0);
//                   const value = context.raw;
//                   const percentage = Math.round((value / total) * 100);
//                   return `${context.label}: ${value} (${percentage}%)`;
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

// export default GeneratorStatusChart;