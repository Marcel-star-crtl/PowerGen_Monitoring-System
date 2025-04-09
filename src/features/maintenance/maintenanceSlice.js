// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance } from '../../services/api';

// export const fetchMaintenance = createAsyncThunk(
//   'maintenance/fetchMaintenance',
//   async () => {
//     const response = await getMaintenance();
//     return response.data;
//   }
// );

// export const addMaintenance = createAsyncThunk(
//   'maintenance/addMaintenance',
//   async (maintenanceData) => {
//     const response = await createMaintenance(maintenanceData);
//     return response.data;
//   }
// );

// export const editMaintenance = createAsyncThunk(
//   'maintenance/editMaintenance',
//   async ({ id, ...maintenanceData }) => {
//     const response = await updateMaintenance(id, maintenanceData);
//     return response.data;
//   }
// );

// export const removeMaintenance = createAsyncThunk(
//   'maintenance/removeMaintenance',
//   async (id) => {
//     await deleteMaintenance(id);
//     return id;
//   }
// );

// const maintenanceSlice = createSlice({
//   name: 'maintenance',
//   initialState: {
//     maintenance: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchMaintenance.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchMaintenance.fulfilled, (state, action) => {
//         state.loading = false;
//         state.maintenance = action.payload;
//       })
//       .addCase(fetchMaintenance.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(addMaintenance.fulfilled, (state, action) => {
//         state.maintenance.push(action.payload);
//       })
//       .addCase(editMaintenance.fulfilled, (state, action) => {
//         const index = state.maintenance.findIndex(
//           (m) => m._id === action.payload._id
//         );
//         if (index !== -1) {
//           state.maintenance[index] = action.payload;
//         }
//       })
//       .addCase(removeMaintenance.fulfilled, (state, action) => {
//         state.maintenance = state.maintenance.filter(
//           (m) => m._id !== action.payload
//         );
//       });
//   },
// });

// export default maintenanceSlice.reducer;



import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  getMaintenance, 
  createMaintenance, 
  updateMaintenance, 
  deleteMaintenance,
  getGeneratorMaintenanceHistory 
} from '../../services/api';

export const fetchMaintenance = createAsyncThunk(
  'maintenance/fetchMaintenance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMaintenance();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchGeneratorMaintenance = createAsyncThunk(
  'maintenance/fetchGeneratorMaintenance',
  async (generatorId, { rejectWithValue }) => {
    try {
      const response = await getGeneratorMaintenanceHistory(generatorId);
      return { generatorId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addMaintenance = createAsyncThunk(
  'maintenance/addMaintenance',
  async (maintenanceData, { rejectWithValue }) => {
    try {
      const response = await createMaintenance(maintenanceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const editMaintenance = createAsyncThunk(
  'maintenance/editMaintenance',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateMaintenance(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeMaintenance = createAsyncThunk(
  'maintenance/removeMaintenance',
  async (id, { rejectWithValue }) => {
    try {
      await deleteMaintenance(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: {
    maintenance: [],
    generatorMaintenance: {}, // Stores maintenance by generator ID
    loading: false,
    error: null,
    historyLoading: false,
    historyError: null
  },
  reducers: {
    clearMaintenanceError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all maintenance
      .addCase(fetchMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenance = action.payload;
      })
      .addCase(fetchMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch generator-specific maintenance
      .addCase(fetchGeneratorMaintenance.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchGeneratorMaintenance.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.generatorMaintenance[action.payload.generatorId] = action.payload.data;
      })
      .addCase(fetchGeneratorMaintenance.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      })

      // Add new maintenance
      .addCase(addMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenance.unshift(action.payload);
      })
      .addCase(addMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update maintenance
      .addCase(editMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.maintenance.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.maintenance[index] = action.payload;
        }
        // Also update in generator-specific history if exists
        if (state.generatorMaintenance[action.payload.generator_id]) {
          const genIndex = state.generatorMaintenance[action.payload.generator_id]
            .findIndex(m => m._id === action.payload._id);
          if (genIndex !== -1) {
            state.generatorMaintenance[action.payload.generator_id][genIndex] = action.payload;
          }
        }
      })
      .addCase(editMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete maintenance
      .addCase(removeMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenance = state.maintenance.filter(m => m._id !== action.payload);
        // Also remove from generator-specific history if exists
        Object.keys(state.generatorMaintenance).forEach(genId => {
          state.generatorMaintenance[genId] = state.generatorMaintenance[genId]
            .filter(m => m._id !== action.payload);
        });
      })
      .addCase(removeMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearMaintenanceError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;