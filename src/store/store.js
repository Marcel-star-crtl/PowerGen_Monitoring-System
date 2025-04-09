// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from '../features/auth/authSlice';
// import dashboardReducer from '../features/dashboard/dashboardSlice';
// import generatorReducer from '../features/generators/generatorSlice';
// import towerReducer from '../features/towers/towerSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     dashboard: dashboardReducer,
//     generators: generatorReducer,
//     towers: towerReducer,
//     // Add other reducers
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });


import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import generatorReducer from '../features/generators/generatorSlice';
import towerReducer from '../features/towers/towerSlice';
import telemetryReducer from '../features/telemetry/telemetrySlice';
import maintenanceReducer from '../features/maintenance/maintenanceSlice';
import alertReducer from '../features/alerts/alertSlice';
import userReducer from '../features/user/userSlice';
import simulationReducer from '../features/simulation/simulationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    generators: generatorReducer,
    towers: towerReducer,
    telemetry: telemetryReducer,
    maintenance: maintenanceReducer,
    alerts: alertReducer,
    user: userReducer,
    simulation: simulationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});