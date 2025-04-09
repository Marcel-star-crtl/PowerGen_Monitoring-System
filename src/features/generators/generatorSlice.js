import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getGenerators,
  createGenerator,
  updateGenerator,
  deleteGenerator,
  updateGeneratorStatus,
} from '../../services/api';

export const fetchGenerators = createAsyncThunk(
  'generators/fetchGenerators',
  async () => {
    const response = await getGenerators();
    return response.data;
  }
);

export const addGenerator = createAsyncThunk(
  'generators/addGenerator',
  async (generatorData) => {
    const response = await createGenerator(generatorData);
    return response.data;
  }
);

export const editGenerator = createAsyncThunk(
  'generators/editGenerator',
  async ({ id, ...generatorData }) => {
    const response = await updateGenerator(id, generatorData);
    return response.data;
  }
);

export const removeGenerator = createAsyncThunk(
  'generators/removeGenerator',
  async (id) => {
    await deleteGenerator(id);
    return id;
  }
);

export const changeGeneratorStatus = createAsyncThunk(
  'generators/changeStatus',
  async ({ id, status }) => {
    const response = await updateGeneratorStatus(id, status);
    return response.data;
  }
);

const generatorSlice = createSlice({
  name: 'generators',
  initialState: {
    generators: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGenerators.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGenerators.fulfilled, (state, action) => {
        state.loading = false;
        state.generators = action.payload;
      })
      .addCase(fetchGenerators.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addGenerator.fulfilled, (state, action) => {
        state.generators.push(action.payload);
      })
      .addCase(editGenerator.fulfilled, (state, action) => {
        const index = state.generators.findIndex(
          (g) => g._id === action.payload._id
        );
        if (index !== -1) {
          state.generators[index] = action.payload;
        }
      })
      .addCase(removeGenerator.fulfilled, (state, action) => {
        state.generators = state.generators.filter(
          (g) => g._id !== action.payload
        );
      })
      .addCase(changeGeneratorStatus.fulfilled, (state, action) => {
        const index = state.generators.findIndex(
          (g) => g._id === action.payload._id
        );
        if (index !== -1) {
          state.generators[index].status = action.payload.status;
        }
      });
  },
});

export default generatorSlice.reducer;