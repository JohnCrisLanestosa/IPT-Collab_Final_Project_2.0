import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData) => {
    const response = await axios.post(
      "http://localhost:5000/api/shop/order/create",
      orderData,
      {
        withCredentials: true, // Send cookies for authentication
      }
    );

    return response.data;
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async ({ archived }) => {
    const params = archived !== undefined ? `?archived=${archived}` : "";
    const response = await axios.get(
      `http://localhost:5000/api/shop/order/list${params}`,
      {
        withCredentials: true, // Send cookies for authentication
      }
    );

    return response.data;
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id) => {
    const response = await axios.get(
      `http://localhost:5000/api/shop/order/details/${id}`,
      {
        withCredentials: true, // Send cookies for authentication
      }
    );

    return response.data;
  }
);

export const submitPaymentProof = createAsyncThunk(
  "/order/submitPaymentProof",
  async ({ id, paymentProofFile }) => {
    const formData = new FormData();
    formData.append("paymentProof", paymentProofFile);
    
    const response = await axios.post(
      `http://localhost:5000/api/shop/order/submit-payment-proof/${id}`,
      formData,
      {
        withCredentials: true, // Send cookies for authentication
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }
);

export const cancelOrder = createAsyncThunk(
  "/order/cancelOrder",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/shop/order/cancel/${id}`,
        {},
        {
          withCredentials: true, // Send cookies for authentication
        }
      );

      return response.data;
    } catch (error) {
      // Return error message from API response, or a default message
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to cancel order",
        }
      );
    }
  }
);

export const archiveOrder = createAsyncThunk(
  "/order/archiveOrder",
  async ({ id }) => {
    const response = await axios.post(
      `http://localhost:5000/api/shop/order/archive/${id}`,
      {},
      {
        withCredentials: true, // Send cookies for authentication
      }
    );

    return response.data;
  }
);

export const unarchiveOrder = createAsyncThunk(
  "/order/unarchiveOrder",
  async ({ id }) => {
    const response = await axios.post(
      `http://localhost:5000/api/shop/order/unarchive/${id}`,
      {},
      {
        withCredentials: true, // Send cookies for authentication
      }
    );

    return response.data;
  }
);

export const restoreCancelledOrder = createAsyncThunk(
  "/order/restoreCancelledOrder",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/shop/order/restore/${id}`,
        {},
        {
          withCredentials: true, // Send cookies for authentication
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to restore order",
        }
      );
    }
  }
);

export const deleteCancelledOrder = createAsyncThunk(
  "/order/deleteCancelledOrder",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/shop/order/delete/${id}`,
        {},
        {
          withCredentials: true, // Send cookies for authentication
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: error.message || "Failed to delete order",
        }
      );
    }
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderId = action.payload.orderId;
      })
      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading = false;
        state.orderId = null;
      })
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      })
      .addCase(submitPaymentProof.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitPaymentProof.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.orderDetails) {
          // Payment status remains pending until admin confirms (readyForPickup)
          state.orderDetails.paymentProof = action.payload.data?.paymentProof;
        }
      })
      .addCase(submitPaymentProof.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update order in orderList if it exists
        if (state.orderList && action.payload.data) {
          const index = state.orderList.findIndex(
            (order) => order._id === action.payload.data._id
          );
          if (index !== -1) {
            state.orderList[index] = action.payload.data;
          }
        }
        // Update orderDetails if it's the cancelled order
        if (state.orderDetails && state.orderDetails._id === action.payload.data._id) {
          state.orderDetails.orderStatus = "cancelled";
          state.orderDetails.orderUpdateDate = action.payload.data.orderUpdateDate;
        }
      })
      .addCase(cancelOrder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(archiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(archiveOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update order in orderList if it exists
        if (state.orderList) {
          const index = state.orderList.findIndex(
            (order) => order._id === action.meta.arg.id
          );
          if (index !== -1) {
            state.orderList[index].isArchived = true;
          }
        }
        // Update orderDetails if it's the archived order
        if (state.orderDetails && state.orderDetails._id === action.meta.arg.id) {
          state.orderDetails.isArchived = true;
        }
      })
      .addCase(archiveOrder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(unarchiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(unarchiveOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update order in orderList if it exists
        if (state.orderList) {
          const index = state.orderList.findIndex(
            (order) => order._id === action.meta.arg.id
          );
          if (index !== -1) {
            state.orderList[index].isArchived = false;
          }
        }
        // Update orderDetails if it's the unarchived order
        if (state.orderDetails && state.orderDetails._id === action.meta.arg.id) {
          state.orderDetails.isArchived = false;
        }
      })
      .addCase(unarchiveOrder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(restoreCancelledOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreCancelledOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.orderList && action.payload.data) {
          const index = state.orderList.findIndex(
            (order) => order._id === action.payload.data._id
          );
          if (index !== -1) {
            state.orderList[index] = action.payload.data;
          } else {
            state.orderList.push(action.payload.data);
          }
        }
        if (state.orderDetails && action.payload.data) {
          if (state.orderDetails._id === action.payload.data._id) {
            state.orderDetails = action.payload.data;
          }
        }
      })
      .addCase(restoreCancelledOrder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteCancelledOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCancelledOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedId = action.payload?.data?._id;
        if (deletedId && state.orderList) {
          state.orderList = state.orderList.filter(
            (order) => order._id !== deletedId
          );
        }
        if (deletedId && state.orderDetails && state.orderDetails._id === deletedId) {
          state.orderDetails = null;
        }
      })
      .addCase(deleteCancelledOrder.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { resetOrderDetails } = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;
