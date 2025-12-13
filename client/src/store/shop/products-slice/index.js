import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  productList: [],
  productDetails: null,
};

export const fetchAllFilteredProducts = createAsyncThunk(
  "/products/fetchAllProducts",
  async ({ filterParams, sortParams }) => {
    console.log(fetchAllFilteredProducts, "fetchAllFilteredProducts");

    const query = new URLSearchParams({
      ...filterParams,
      sortBy: sortParams,
    });

    const result = await axios.get(
      `http://localhost:5000/api/shop/products/get?${query}`
    );

    console.log(result);

    return result?.data;
  }
);

export const fetchProductDetails = createAsyncThunk(
  "/products/fetchProductDetails",
  async (id) => {
    const result = await axios.get(
      `http://localhost:5000/api/shop/products/get/${id}`
    );

    return result?.data;
  }
);

const shoppingProductSlice = createSlice({
  name: "shoppingProducts",
  initialState,
  reducers: {
    setProductDetails: (state) => {
      state.productDetails = null;
    },
    updateProductStock: (state, action) => {
      const { productId, totalStock } = action.payload;
      
      // Update product in productList
      const productIndex = state.productList.findIndex(
        (product) => product._id === productId
      );
      if (productIndex !== -1) {
        state.productList[productIndex].totalStock = totalStock;
      }
      
      // Update productDetails if it's the same product
      if (state.productDetails && state.productDetails._id === productId) {
        state.productDetails.totalStock = totalStock;
      }
    },
    updateProductFromSocket: (state, action) => {
      const { product } = action.payload;
      
      if (!product || !product._id) return;
      
      // Update product in productList
      const productIndex = state.productList.findIndex(
        (p) => p._id === product._id
      );
      if (productIndex !== -1) {
        // Merge the updated product data
        state.productList[productIndex] = {
          ...state.productList[productIndex],
          ...product,
        };
      }
      
      // Update productDetails if it's the same product
      if (state.productDetails && state.productDetails._id === product._id) {
        state.productDetails = {
          ...state.productDetails,
          ...product,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllFilteredProducts.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchAllFilteredProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data;
      })
      .addCase(fetchAllFilteredProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
      })
      .addCase(fetchProductDetails.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetails = action.payload.data;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.productDetails = null;
      });
  },
});

export const { setProductDetails, updateProductStock, updateProductFromSocket } = shoppingProductSlice.actions;

export default shoppingProductSlice.reducer;
