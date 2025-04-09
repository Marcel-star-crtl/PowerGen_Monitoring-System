import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getTowers, createTower, updateTower, deleteTower } from '../../services/api';

export const fetchTowers = createAsyncThunk(
  'towers/fetchTowers',
  async () => {
    const response = await getTowers();
    return response.data;
  }
);

export const addTower = createAsyncThunk(
  'towers/addTower',
  async (towerData) => {
    const response = await createTower(towerData);
    return response.data;
  }
);

export const editTower = createAsyncThunk(
  'towers/editTower',
  async ({ id, ...towerData }) => {
    const response = await updateTower(id, towerData);
    return response.data;
  }
);

export const removeTower = createAsyncThunk(
  'towers/removeTower',
  async (id) => {
    await deleteTower(id);
    return id;
  }
);

const towerSlice = createSlice({
  name: 'towers',
  initialState: {
    towers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTowers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTowers.fulfilled, (state, action) => {
        state.loading = false;
        state.towers = action.payload;
      })
      .addCase(fetchTowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTower.fulfilled, (state, action) => {
        state.towers.push(action.payload);
      })
      .addCase(editTower.fulfilled, (state, action) => {
        const index = state.towers.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.towers[index] = action.payload;
        }
      })
      .addCase(removeTower.fulfilled, (state, action) => {
        state.towers = state.towers.filter(
          (t) => t._id !== action.payload
        );
      });
  },
});

export default towerSlice.reducer;