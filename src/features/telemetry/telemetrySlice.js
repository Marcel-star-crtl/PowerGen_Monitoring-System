import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getGeneratorTelemetry, getTelemetry } from '../../services/api';

// In your telemetrySlice.js
export const fetchGeneratorTelemetry = createAsyncThunk(
  'telemetry/fetchGeneratorTelemetry',
  async ({ generatorId, start, end }) => {
    const params = {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    };
    const response = await getGeneratorTelemetry(generatorId, params);
    return response.data;
  }
);

export const fetchTowerTelemetry = createAsyncThunk(
  'telemetry/fetchTowerTelemetry',
  async ({ towerId, start, end }) => {
    const params = {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    };
    const response = await getTelemetry(towerId, params);
    return response.data;
  }
);

const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState: {
    telemetry: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTelemetry: (state) => {
      state.telemetry = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGeneratorTelemetry.pending, (state) => {
        state.loading = true;
        state.telemetry = [];
      })
      .addCase(fetchGeneratorTelemetry.fulfilled, (state, action) => {
        state.loading = false;
        state.telemetry = action.payload;
      })
      .addCase(fetchGeneratorTelemetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTowerTelemetry.pending, (state) => {
        state.loading = true;
        state.telemetry = [];
      })
      .addCase(fetchTowerTelemetry.fulfilled, (state, action) => {
        state.loading = false;
        state.telemetry = action.payload;
      })
      .addCase(fetchTowerTelemetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearTelemetry } = telemetrySlice.actions;
export default telemetrySlice.reducer;




// // updated with simulation
// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { getGeneratorTelemetry, getSimulatedTelemetry } from '../../services/api';

// export const fetchGeneratorTelemetry = createAsyncThunk(
//   'telemetry/fetchGeneratorTelemetry',
//   async ({ generatorId, start, end }) => {
//     const params = {
//       start: new Date(start).toISOString(),
//       end: new Date(end).toISOString(),
//     };
//     const response = await getGeneratorTelemetry(generatorId, params);
//     return response.data;
//   }
// );

// export const fetchSimulatedTelemetry = createAsyncThunk(
//   'telemetry/fetchSimulatedTelemetry',
//   async (generatorId) => {
//     const response = await getSimulatedTelemetry(generatorId);
//     return response.data;
//   }
// );

// const telemetrySlice = createSlice({
//   name: 'telemetry',
//   initialState: {
//     telemetry: [],
//     simulatedData: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     clearTelemetry: (state) => {
//       state.telemetry = [];
//       state.simulatedData = [];
//     },
//     updateSimulatedData: (state, action) => {
//       state.simulatedData = [action.payload, ...state.simulatedData.slice(0, 99)];
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchGeneratorTelemetry.pending, (state) => {
//         state.loading = true;
//         state.telemetry = [];
//       })
//       .addCase(fetchGeneratorTelemetry.fulfilled, (state, action) => {
//         state.loading = false;
//         state.telemetry = action.payload;
//       })
//       .addCase(fetchGeneratorTelemetry.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(fetchSimulatedTelemetry.pending, (state) => {
//         state.loading = true;
//         state.simulatedData = [];
//       })
//       .addCase(fetchSimulatedTelemetry.fulfilled, (state, action) => {
//         state.loading = false;
//         state.simulatedData = action.payload;
//       })
//       .addCase(fetchSimulatedTelemetry.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       });
//   },
// });

// export const { clearTelemetry, updateSimulatedData } = telemetrySlice.actions;
// export default telemetrySlice.reducer;