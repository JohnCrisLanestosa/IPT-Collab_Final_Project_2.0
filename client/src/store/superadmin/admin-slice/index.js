import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  adminList: {
    active: [],
    archived: [],
  },
  statistics: {
    totalUsers: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
    totalAll: 0,
  },
};

// Get all admins
export const getAllAdmins = createAsyncThunk(
  "superadmin/getAllAdmins",
  async () => {
    const response = await axios.get(
      "http://localhost:5000/api/superadmin/admins",
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Get user statistics
export const getUserStatistics = createAsyncThunk(
  "superadmin/getUserStatistics",
  async () => {
    const response = await axios.get(
      "http://localhost:5000/api/superadmin/admins/statistics",
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Create new admin
export const createAdmin = createAsyncThunk(
  "superadmin/createAdmin",
  async (formData) => {
    const response = await axios.post(
      "http://localhost:5000/api/superadmin/admins/create",
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Update admin
export const updateAdmin = createAsyncThunk(
  "superadmin/updateAdmin",
  async ({ id, formData }) => {
    const response = await axios.put(
      `http://localhost:5000/api/superadmin/admins/${id}`,
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Delete admin
export const deleteAdmin = createAsyncThunk(
  "superadmin/deleteAdmin",
  async (id) => {
    const response = await axios.delete(
      `http://localhost:5000/api/superadmin/admins/${id}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Toggle admin status
export const toggleAdminStatus = createAsyncThunk(
  "superadmin/toggleAdminStatus",
  async ({ id, isActive }) => {
    const response = await axios.patch(
      `http://localhost:5000/api/superadmin/admins/${id}/toggle-status`,
      { isActive },
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Archive admin
export const archiveAdmin = createAsyncThunk(
  "superadmin/archiveAdmin",
  async (id) => {
    const response = await axios.patch(
      `http://localhost:5000/api/superadmin/admins/${id}/archive`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

// Unarchive admin
export const unarchiveAdmin = createAsyncThunk(
  "superadmin/unarchiveAdmin",
  async (id) => {
    const response = await axios.patch(
      `http://localhost:5000/api/superadmin/admins/${id}/unarchive`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get all admins
      .addCase(getAllAdmins.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllAdmins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminList = action.payload.data || {
          active: [],
          archived: [],
        };
      })
      .addCase(getAllAdmins.rejected, (state) => {
        state.isLoading = false;
        state.adminList = {
          active: [],
          archived: [],
        };
      })
      // Get statistics
      .addCase(getUserStatistics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.data;
      })
      .addCase(getUserStatistics.rejected, (state) => {
        state.isLoading = false;
      })
      // Create admin
      .addCase(createAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAdmin.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createAdmin.rejected, (state) => {
        state.isLoading = false;
      })
      // Update admin
      .addCase(updateAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAdmin.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateAdmin.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete admin
      .addCase(deleteAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAdmin.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteAdmin.rejected, (state) => {
        state.isLoading = false;
      })
      // Archive admin
      .addCase(archiveAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(archiveAdmin.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(archiveAdmin.rejected, (state) => {
        state.isLoading = false;
      })
      // Unarchive admin
      .addCase(unarchiveAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(unarchiveAdmin.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(unarchiveAdmin.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default superAdminSlice.reducer;

