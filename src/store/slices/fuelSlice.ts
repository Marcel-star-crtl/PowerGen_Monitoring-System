import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dieselManagerAPI } from '@/api';
import { FuelConsumption, FuelDashboard, LowFuelAlert } from '@/types/fuel.types';

interface FuelState {
  requests: FuelConsumption[];
  dashboard: FuelDashboard | null;
  alerts: LowFuelAlert[];
  loading: boolean;
  error: string | null;
}

const initialState: FuelState = {
  requests: [],
  dashboard: null,
  alerts: [],
  loading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk(
  'fuel/fetchDashboard',
  async (period: number = 30) => {
    const data = await dieselManagerAPI.getDashboard(period);
    return data;
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'fuel/fetchPendingRequests',
  async () => {
    const response = await dieselManagerAPI.getPendingRequests();
    return response.data;
  }
);

export const fetchLowFuelAlerts = createAsyncThunk(
  'fuel/fetchLowFuelAlerts',
  async (threshold: number = 25) => {
    const response = await dieselManagerAPI.getLowFuelAlerts(threshold);
    return response.data;
  }
);

export const approveFuelRequest = createAsyncThunk(
  'fuel/approveFuelRequest',
  async ({ requestId, notes }: { requestId: string; notes?: string }) => {
    const data = await dieselManagerAPI.approveFuelRequest(requestId, notes || '');
    return { requestId, data };
  }
);

export const rejectFuelRequest = createAsyncThunk(
  'fuel/rejectFuelRequest',
  async ({ requestId, reason }: { requestId: string; reason: string }) => {
    const data = await dieselManagerAPI.rejectFuelRequest(requestId, reason);
    return { requestId, data };
  }
);

const fuelSlice = createSlice({
  name: 'fuel',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard';
      })
      // Fetch Pending Requests
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch requests';
      })
      // Fetch Low Fuel Alerts
      .addCase(fetchLowFuelAlerts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLowFuelAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchLowFuelAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      })
      // Approve Request
      .addCase(approveFuelRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req._id !== action.payload.requestId);
      })
      // Reject Request
      .addCase(rejectFuelRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req._id !== action.payload.requestId);
      });
  },
});

export const { clearError } = fuelSlice.actions;
export default fuelSlice.reducer;