import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  productList: [],
};

export const addNewProduct = createAsyncThunk(
  "/products/addnewproduct",
  async (formData) => {
    const result = await axios.post(
      "http://localhost:5000/api/admin/products/add",
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

export const fetchAllProducts = createAsyncThunk(
  "/products/fetchAllProducts",
  async () => {
    const result = await axios.get(
      "http://localhost:5000/api/admin/products/get"
    );

    return result?.data;
  }
);

export const editProduct = createAsyncThunk(
  "/products/editProduct",
  async ({ id, formData }) => {
    const result = await axios.put(
      `http://localhost:5000/api/admin/products/edit/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

export const lockProduct = createAsyncThunk(
  "/products/lockProduct",
  async ({ id, userId, userName }) => {
    const result = await axios.post(
      `http://localhost:5000/api/admin/products/lock/${id}`,
      { userId, userName },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

export const unlockProduct = createAsyncThunk(
  "/products/unlockProduct",
  async ({ id, userId }) => {
    const result = await axios.post(
      `http://localhost:5000/api/admin/products/unlock/${id}`,
      { userId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

export const archiveProduct = createAsyncThunk(
  "/products/archiveProduct",
  async ({ id, adminId }) => {
    const result = await axios.post(
      `http://localhost:5000/api/admin/products/archive/${id}`,
      { adminId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

export const unarchiveProduct = createAsyncThunk(
  "/products/unarchiveProduct",
  async ({ id, adminId }) => {
    const result = await axios.post(
      `http://localhost:5000/api/admin/products/unarchive/${id}`,
      { adminId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return result?.data;
  }
);

const AdminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
      });
  },
});

export default AdminProductsSlice.reducer;
