import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  getSimulatedTelemetry, 
  startSimulation, 
  stopSimulation,
  updateSimulationParams,
  getSimulationStatus,
  setSimulationSpeed,
  triggerSimulationEvent
} from '../../services/api';

export const fetchSimulatedTelemetry = createAsyncThunk(
  'simulation/fetchTelemetry',
  async (generatorId, { rejectWithValue }) => {
    try {
      const response = await getSimulatedTelemetry(generatorId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const startGeneratorSimulation = createAsyncThunk(
  'simulation/start',
  async (generatorId, { rejectWithValue }) => {
    try {
      const response = await startSimulation(generatorId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSimulationParameters = createAsyncThunk(
  'simulation/updateParams',
  async ({ generatorId, params }, { rejectWithValue }) => {
    try {
      const response = await updateSimulationParams(generatorId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const changeSimulationSpeed = createAsyncThunk(
  'simulation/changeSpeed',
  async (speed, { rejectWithValue }) => {
    try {
      const response = await setSimulationSpeed(speed);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: {
    telemetry: [],
    status: 'idle', // 'idle' | 'running' | 'paused'
    speed: 1,
    activeGenerator: null,
    loading: false,
    error: null
  },
  reducers: {
    updateLiveTelemetry: (state, action) => {
      state.telemetry = [action.payload, ...state.telemetry.slice(0, 99)];
    },
    clearSimulationData: (state) => {
      state.telemetry = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSimulatedTelemetry.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSimulatedTelemetry.fulfilled, (state, action) => {
        state.loading = false;
        state.telemetry = action.payload;
      })
      .addCase(fetchSimulatedTelemetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startGeneratorSimulation.fulfilled, (state, action) => {
        state.status = 'running';
        state.activeGenerator = action.payload.generatorId;
      })
      .addCase(updateSimulationParameters.fulfilled, (state, action) => {
        // Update specific parameters
        state.speed = action.payload.speed || state.speed;
      })
      .addCase(changeSimulationSpeed.fulfilled, (state, action) => {
        state.speed = action.payload.speed;
      });
  }
});

export const { updateLiveTelemetry, clearSimulationData } = simulationSlice.actions;
export default simulationSlice.reducer;