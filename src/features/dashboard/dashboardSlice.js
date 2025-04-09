import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDashboardStats, getTowerStats } from '../../services/api';

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async () => {
    const response = await getDashboardStats();
    return response.data;
  }
);

export const fetchTowerStats = createAsyncThunk(
  'dashboard/fetchTowerStats',
  async () => {
    const response = await getTowerStats();
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    towerStats: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTowerStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTowerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.towerStats = action.payload;
      })
      .addCase(fetchTowerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default dashboardSlice.reducer;






// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { 
//   getDashboardStats,
//   getSimulationStats 
// } from '../../services/api';

// export const fetchDashboardStats = createAsyncThunk(
//   'dashboard/fetchStats',
//   async (_, { rejectWithValue }) => {
//     try {
//       const [realStats, simStats] = await Promise.all([
//         getDashboardStats(),
//         getSimulationStats()
//       ]);
//       return {
//         ...realStats.data,
//         simulatedGenerators: simStats.data.total_generators,
//         simulatedAlerts: simStats.data.active_alerts
//       };
//     } catch (error) {
//       return rejectWithValue(error.response.data);
//     }
//   }
// );

// const dashboardSlice = createSlice({
//   name: 'dashboard',
//   initialState: {
//     stats: null,
//     loading: false,
//     error: null,
//     dataSource: 'combined' // 'real', 'simulated', or 'combined'
//   },
//   reducers: {
//     setDataSource: (state, action) => {
//       state.dataSource = action.payload;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchDashboardStats.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchDashboardStats.fulfilled, (state, action) => {
//         state.loading = false;
//         state.stats = action.payload;
//       })
//       .addCase(fetchDashboardStats.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   }
// });

// export const { setDataSource } = dashboardSlice.actions;
// export default dashboardSlice.reducer;