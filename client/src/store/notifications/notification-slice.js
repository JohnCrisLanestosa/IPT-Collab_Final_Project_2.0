import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const target = action.payload?.target || "admin";
      const newNotification = {
        id: Date.now(),
        ...action.payload,
        target,
        read: false,
        timestamp: new Date().toISOString(),
      };
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    markAllAsReadByTarget: (state, action) => {
      const target = action.payload || "admin";
      state.notifications.forEach((notification) => {
        const notificationTarget = notification.target || "admin";
        if (notificationTarget === target && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload
      );
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  markAllAsReadByTarget,
  removeNotification,
  clearAllNotifications,
  setConnectionStatus,
} = notificationSlice.actions;

export default notificationSlice.reducer;

