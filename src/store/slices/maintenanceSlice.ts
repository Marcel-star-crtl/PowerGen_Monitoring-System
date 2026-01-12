import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { technicianAPI } from '@/api';
import { Maintenance } from '@/types/maintenance.types';

interface MaintenanceState {
  tasks: Maintenance[];
  drafts: Maintenance[];
  currentTask: Maintenance | null;
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceState = {
  tasks: [],
  drafts: [],
  currentTask: null,
  loading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'maintenance/fetchTasks',
  async (params: { status?: string } = {}) => {
    const response = await technicianAPI.getMaintenanceTasks(params);
    return response.data || []; // Ensure array return
  }
);

export const fetchDrafts = createAsyncThunk('maintenance/fetchDrafts', async () => {
  const response = await technicianAPI.getDrafts();
  return response.data || []; // Ensure array return
});

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Maintenance>) => {
      state.currentTask = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // Fetch Drafts
      .addCase(fetchDrafts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.drafts = action.payload;
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch drafts';
      });
  },
});

export const { setCurrentTask, clearCurrentTask, clearError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;










// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { technicianAPI } from '@/api';
// import { Maintenance } from '@/types/maintenance.types';

// interface MaintenanceState {
//   tasks: Maintenance[];
//   drafts: Maintenance[];
//   currentTask: Maintenance | null;
//   loading: boolean;
//   error: string | null;
// }

// const initialState: MaintenanceState = {
//   tasks: [],
//   drafts: [],
//   currentTask: null,
//   loading: false,
//   error: null,
// };

// export const fetchTasks = createAsyncThunk(
//   'maintenance/fetchTasks',
//   async (params: { status?: string } = {}) => {
//     const response = await technicianAPI.getMaintenanceTasks(params);
//     return response.data;
//   }
// );

// export const fetchDrafts = createAsyncThunk('maintenance/fetchDrafts', async () => {
//   const response = await technicianAPI.getDrafts();
//   return response.data;
// });

// const maintenanceSlice = createSlice({
//   name: 'maintenance',
//   initialState,
//   reducers: {
//     setCurrentTask: (state, action: PayloadAction<Maintenance>) => {
//       state.currentTask = action.payload;
//     },
//     clearCurrentTask: (state) => {
//       state.currentTask = null;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch Tasks
//       .addCase(fetchTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = action.payload;
//       })
//       .addCase(fetchTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message || 'Failed to fetch tasks';
//       })
//       // Fetch Drafts
//       .addCase(fetchDrafts.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchDrafts.fulfilled, (state, action) => {
//         state.loading = false;
//         state.drafts = action.payload;
//       })
//       .addCase(fetchDrafts.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message || 'Failed to fetch drafts';
//       });
//   },
// });

// export const { setCurrentTask, clearCurrentTask, clearError } = maintenanceSlice.actions;
// export default maintenanceSlice.reducer;
