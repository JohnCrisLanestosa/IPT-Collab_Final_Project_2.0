import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ShoppingHeader from "./header";
import { useTawkTo } from "@/hooks/useTawkTo";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { addNotification, setConnectionStatus } from "@/store/notifications/notification-slice";
import { useToast } from "@/components/ui/use-toast";
import { getAllOrdersByUserId, getOrderDetails } from "@/store/shop/order-slice";

function ShoppingLayout() {
  const { user } = useSelector((state) => state.auth);
  const { orderDetails } = useSelector((state) => state.shopOrder);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const currentOrderIdRef = useRef(orderDetails?._id || null);
  const { toast } = useToast();

  useTawkTo({
    enabled: user?.role === "user",
  });

  useEffect(() => {
    currentOrderIdRef.current = orderDetails?._id || null;
  }, [orderDetails?._id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      dispatch(setConnectionStatus(true));
      socket.emit("register-user", user.id);
    });

    socket.on("disconnect", () => {
      dispatch(setConnectionStatus(false));
    });

    socket.on("order-updated", (payload) => {
      dispatch(
        addNotification({
          target: "user",
          type: "order-update",
          title: "Order Update",
          message:
            payload?.message ||
            `Your order ${payload?.orderId || ""} is now ${
              payload?.newStatusLabel || payload?.newStatus || "updated"
            }.`,
          orderId: payload?.orderId,
          status: payload?.newStatus,
        })
      );

      toast({
        title: "Order Updated",
        description:
          payload?.message ||
          `Your order ${payload?.orderId || ""} is now ${
            payload?.newStatusLabel || payload?.newStatus || "updated"
          }.`,
        variant: "success",
      });

      if (user?.id) {
        dispatch(getAllOrdersByUserId({ userId: user.id }));
      }

      if (payload?.orderId && currentOrderIdRef.current === payload.orderId) {
        dispatch(getOrderDetails(payload.orderId));
      }
    });

    return () => {
      socket.off("order-updated");
      socket.disconnect();
    };
  }, [dispatch, toast, user?.id]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-white to-blue-50 dark:from-background dark:via-card dark:to-background">
      {/* common header */}
      <ShoppingHeader />
      <main className="flex flex-col w-full flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}

export default ShoppingLayout;
