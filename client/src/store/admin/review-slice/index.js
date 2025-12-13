import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  reviews: [],
};

export const getProductReviewsForAdmin = createAsyncThunk(
  "adminReview/getProductReviewsForAdmin",
  async (productId) => {
    const response = await axios.get(
      `http://localhost:5000/api/admin/reviews/${productId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

export const hideReview = createAsyncThunk(
  "adminReview/hideReview",
  async (reviewId) => {
    const response = await axios.put(
      `http://localhost:5000/api/admin/reviews/hide/${reviewId}`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

export const unhideReview = createAsyncThunk(
  "adminReview/unhideReview",
  async (reviewId) => {
    const response = await axios.put(
      `http://localhost:5000/api/admin/reviews/unhide/${reviewId}`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
);

const adminReviewSlice = createSlice({
  name: "adminReview",
  initialState,
  reducers: {
    resetReviews: (state) => {
      state.reviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProductReviewsForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProductReviewsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.data;
      })
      .addCase(getProductReviewsForAdmin.rejected, (state) => {
        state.isLoading = false;
        state.reviews = [];
      })
      .addCase(hideReview.fulfilled, (state, action) => {
        const reviewId = action.payload.data?._id;
        if (reviewId) {
          const review = state.reviews.find((r) => r._id === reviewId);
          if (review) {
            review.isHidden = true;
          }
        }
      })
      .addCase(unhideReview.fulfilled, (state, action) => {
        const reviewId = action.payload.data?._id;
        if (reviewId) {
          const review = state.reviews.find((r) => r._id === reviewId);
          if (review) {
            review.isHidden = false;
          }
        }
      });
  },
});

export const { resetReviews } = adminReviewSlice.actions;
export default adminReviewSlice.reducer;

