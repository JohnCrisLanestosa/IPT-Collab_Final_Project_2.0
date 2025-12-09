import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  profile: null,
  error: null,
};

// Get profile
export const getAdminProfile = createAsyncThunk(
  "adminProfile/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/profile",
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch admin profile",
        status: error?.response?.status || 500,
      });
    }
  }
);

// Update profile (includes profile picture)
export const updateAdminProfile = createAsyncThunk(
  "adminProfile/updateProfile",
  async (formData) => {
    const response = await axios.put(
      "http://localhost:5000/api/admin/profile",
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

const adminProfileSlice = createSlice({
  name: "adminProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get profile
      .addCase(getAdminProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.data;
        state.error = null;
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.profile = null;
        state.error = action.payload || null;
      })
      // Update profile
      .addCase(updateAdminProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.profile = { ...state.profile, ...action.payload.data };
        }
      })
      .addCase(updateAdminProfile.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default adminProfileSlice.reducer;

