import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  orderList: [],
  orderDetails: null,
};

export const getAllOrdersForAdmin = createAsyncThunk(
  "/order/getAllOrdersForAdmin",
  async (archived = false) => {
    // archived can be: false, "true" (for cancelled), or "archive" (for archive)
    const response = await axios.get(
      `http://localhost:5000/api/admin/orders/get?archived=${archived}`
    );

    return response.data;
  }
);

export const getOrderDetailsForAdmin = createAsyncThunk(
  "/order/getOrderDetailsForAdmin",
  async (id) => {
    const response = await axios.get(
      `http://localhost:5000/api/admin/orders/details/${id}`
    );

    return response.data;
  }
);

export const updateOrderStatus = createAsyncThunk(
  "/order/updateOrderStatus",
  async ({ id, orderStatus }) => {
    const response = await axios.put(
      `http://localhost:5000/api/admin/orders/update/${id}`,
      {
        orderStatus,
      }
    );

    return response.data;
  }
);

export const archiveOrder = createAsyncThunk(
  "/order/archiveOrder",
  async (id) => {
    const response = await axios.put(
      `http://localhost:5000/api/admin/orders/archive/${id}`
    );

    return response.data;
  }
);

export const unarchiveOrder = createAsyncThunk(
  "/order/unarchiveOrder",
  async (id) => {
    const response = await axios.put(
      `http://localhost:5000/api/admin/orders/unarchive/${id}`
    );

    return response.data;
  }
);

const adminOrderSlice = createSlice({
  name: "adminOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      console.log("resetOrderDetails");

      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllOrdersForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersForAdmin.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })
      .addCase(getOrderDetailsForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetailsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetailsForAdmin.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      })
      .addCase(archiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(archiveOrder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(archiveOrder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(unarchiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(unarchiveOrder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(unarchiveOrder.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { resetOrderDetails } = adminOrderSlice.actions;

export default adminOrderSlice.reducer;
