import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/superadmin/reports";

export const fetchSalesReport = createAsyncThunk(
  "superAdminReports/fetchSalesReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sales`, {
        withCredentials: true,
      });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch sales report."
      );
    }
  }
);

const initialState = {
  data: null,
  isLoading: false,
  error: null,
};

const reportSlice = createSlice({
  name: "superAdminReports",
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.isLoading = false;
        state.data = null;
        state.error = action.payload;
      });
  },
});

export const { clearReportError } = reportSlice.actions;

export default reportSlice.reducer;


