import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  activityLogs: [],
  productHistory: [],
  adminActivity: [],
  summary: {
    actionSummary: [],
    adminSummary: [],
    productSummary: [],
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  },
  filters: {
    action: null,
    adminId: null,
    startDate: null,
    endDate: null,
  },
};

// Get all activity logs
export const getAllActivityLogs = createAsyncThunk(
  "activity/getAllActivityLogs",
  async ({ page = 1, limit = 50, action = null, adminId = null }) => {
    let url = `http://localhost:5000/api/superadmin/activity-logs/all?page=${page}&limit=${limit}`;
    if (action) url += `&action=${action}`;
    if (adminId) url += `&adminId=${adminId}`;

    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  }
);

// Get activity logs for a specific product
export const getProductActivityLogs = createAsyncThunk(
  "activity/getProductActivityLogs",
  async ({ productId, page = 1, limit = 50 }) => {
    const response = await axios.get(
      `http://localhost:5000/api/superadmin/activity-logs/product-history/${productId}?page=${page}&limit=${limit}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Get activity logs for a specific admin
export const getAdminActivityLogs = createAsyncThunk(
  "activity/getAdminActivityLogs",
  async ({ adminId, page = 1, limit = 50 }) => {
    const response = await axios.get(
      `http://localhost:5000/api/superadmin/activity-logs/monitor-admin/${adminId}?page=${page}&limit=${limit}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Get activity summary
export const getActivitySummary = createAsyncThunk(
  "activity/getActivitySummary",
  async ({ startDate = null, endDate = null } = {}) => {
    let url = `http://localhost:5000/api/superadmin/activity-logs/summary`;
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  }
);

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        action: null,
        adminId: null,
        startDate: null,
        endDate: null,
      };
    },
    clearProductHistory: (state) => {
      state.productHistory = [];
    },
    clearAdminActivity: (state) => {
      state.adminActivity = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all activity logs
      .addCase(getAllActivityLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllActivityLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityLogs = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getAllActivityLogs.rejected, (state) => {
        state.isLoading = false;
        state.activityLogs = [];
      })
      // Get product history
      .addCase(getProductActivityLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProductActivityLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productHistory = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getProductActivityLogs.rejected, (state) => {
        state.isLoading = false;
        state.productHistory = [];
      })
      // Get admin activity
      .addCase(getAdminActivityLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdminActivityLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminActivity = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getAdminActivityLogs.rejected, (state) => {
        state.isLoading = false;
        state.adminActivity = [];
      })
      // Get activity summary
      .addCase(getActivitySummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActivitySummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload.data || initialState.summary;
      })
      .addCase(getActivitySummary.rejected, (state) => {
        state.isLoading = false;
        state.summary = initialState.summary;
      });
  },
});

export const { setFilters, clearFilters, clearProductHistory, clearAdminActivity } =
  activitySlice.actions;

export default activitySlice.reducer;

