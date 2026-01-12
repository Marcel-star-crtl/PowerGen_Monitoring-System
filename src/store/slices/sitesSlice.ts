import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { technicianAPI, sitesAPI } from '@/api';
import { Site } from '@/types/sites.types';

interface SitesState {
  sites: Site[];
  assignedSites: Site[];
  currentSite: Site | null;
  loading: boolean;
  error: string | null;
}

const initialState: SitesState = {
  sites: [],
  assignedSites: [],
  currentSite: null,
  loading: false,
  error: null,
};

export const fetchAssignedSites = createAsyncThunk(
  'sites/fetchAssignedSites',
  async () => {
    const response = await technicianAPI.getAssignedSites();
    return response.data;
  }
);

export const fetchSite = createAsyncThunk(
  'sites/fetchSite',
  async (siteId: string) => {
    const data = await sitesAPI.getSite(siteId);
    return data;
  }
);

export const fetchAllSites = createAsyncThunk(
  'sites/fetchAllSites',
  async (params?: { search?: string; region?: string; page?: number; limit?: number }) => {
    const response = await sitesAPI.getSites(params);
    return response.data;
  }
);

const sitesSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    setCurrentSite: (state, action: PayloadAction<Site>) => {
      state.currentSite = action.payload;
    },
    clearCurrentSite: (state) => {
      state.currentSite = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assigned Sites
      .addCase(fetchAssignedSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedSites.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedSites = action.payload;
      })
      .addCase(fetchAssignedSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sites';
      })
      // Fetch Site
      .addCase(fetchSite.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSite.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSite = action.payload;
      })
      .addCase(fetchSite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch site';
      })
      // Fetch All Sites
      .addCase(fetchAllSites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })
      .addCase(fetchAllSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sites';
      });
  },
});

export const { setCurrentSite, clearCurrentSite, clearError } = sitesSlice.actions;
export default sitesSlice.reducer;