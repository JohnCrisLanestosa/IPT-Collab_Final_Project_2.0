import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import adminProductsSlice from "./admin/products-slice";
import adminOrderSlice from "./admin/order-slice";
import adminProfileSlice from "./admin/profile-slice";
import adminReviewSlice from "./admin/review-slice";
import superAdminSlice from "./superadmin/admin-slice";
import superAdminReportSlice from "./superadmin/report-slice";
import activitySlice from "./superadmin/activity-slice";

import shopProductsSlice from "./shop/products-slice";
import shopCartSlice from "./shop/cart-slice";
import shopAddressSlice from "./shop/address-slice";
import shopOrderSlice from "./shop/order-slice";
import shopSearchSlice from "./shop/search-slice";
import shopReviewSlice from "./shop/review-slice";
import commonFeatureSlice from "./common-slice";
import notificationReducer from "./notifications/notification-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,

    adminProducts: adminProductsSlice,
    adminOrder: adminOrderSlice,
    adminProfile: adminProfileSlice,
    adminReview: adminReviewSlice,
    superAdmin: superAdminSlice,
    superAdminReports: superAdminReportSlice,
    activity: activitySlice,

    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopSearch: shopSearchSlice,
    shopReview: shopReviewSlice,

    commonFeature: commonFeatureSlice,
    notifications: notificationReducer,
  },
});

export default store;
