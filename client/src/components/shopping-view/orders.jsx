import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import ShoppingOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersByUserId,
  getOrderDetails,
  resetOrderDetails,
  cancelOrder,
} from "@/store/shop/order-slice";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import { Receipt, Trash2, X, Clock, AlertTriangle } from "lucide-react";
import ShoppingRecycleBin from "./recycle-bin";
import { useToast } from "../ui/use-toast";

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { orderList, orderDetails } = useSelector((state) => state.shopOrder);
  
  const handleViewPayment = (orderId) => {
    navigate(`/shop/payment-success?orderId=${orderId}`);
  };

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetails(getId));
  }

  const handleCancelOrder = async (orderId) => {
    // Confirm cancellation with user
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const result = await dispatch(
        cancelOrder({ id: orderId, userId: user.id })
      ).unwrap();

      toast({
        title: "Order Cancelled",
        description: result.message || "Your order has been cancelled successfully.",
        variant: "success",
      });
      // Refresh the orders list
      dispatch(getAllOrdersByUserId({ userId: user.id }));
    } catch (error) {
      // When using .unwrap() with rejectWithValue, the error is the exact value passed to rejectWithValue
      // which is error.response?.data from axios, typically {success: false, message: "..."}
      let errorMessage = "Failed to cancel order. Please try again.";
      
      if (error?.message) {
        // Direct message property
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // If error is a string
        errorMessage = error;
      } else if (error?.response?.data?.message) {
        // If error has nested response structure
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Cancel order error:", error);
    }
  };

  // Check if an order can be cancelled (pending only)
  // Note: This matches the backend validation in order-controller.js
  const canCancelOrder = (orderStatus) => {
    const cancellableStatuses = ["pending"];
    return cancellableStatuses.includes(orderStatus);
  };

  // Calculate payment deadline status for an order
  const getPaymentDeadlineStatus = (order) => {
    if (!order?.paymentDeadline || order?.paymentStatus !== "pending") return null;
    
    const deadline = new Date(order.paymentDeadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
    const isExpired = timeDiff < 0;
    const isUrgent = timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Less than 24 hours
    const isWarning = timeDiff > 0 && timeDiff <= 2 * 24 * 60 * 60 * 1000; // Less than 2 days

    return { deadline, hoursRemaining, isExpired, isUrgent, isWarning };
  };

  // Reset order details on component mount to prevent unwanted dialog popup
  useEffect(() => {
    dispatch(resetOrderDetails());
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId({ userId: user.id }));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  console.log(orderDetails, "orderDetails");

  // Filter out picked up and cancelled orders - they should only appear in purchase history
  const activeOrders = orderList?.filter(
    (order) => order.orderStatus !== "pickedUp" && order.orderStatus !== "cancelled"
  ) || [];

  if (showCancelled) {
    return <ShoppingRecycleBin onBack={() => setShowCancelled(false)} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Order History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track active orders. Cancelled orders move to your recycle bin.
            </p>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowCancelled(true)}
          >
            <Trash2 className="h-4 w-4" />
            Cancelled Orders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active orders found.</p>
            <p className="text-sm mt-2">
              Picked up orders can be found in your Purchase History.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Payment Deadline</TableHead>
                <TableHead>Order Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((orderItem) => {
                const deadlineStatus = getPaymentDeadlineStatus(orderItem);
                return (
                  <TableRow key={orderItem?._id}>
                    <TableCell>{orderItem?._id}</TableCell>
                    <TableCell>{orderItem?.orderDate.split("T")[0]}</TableCell>
                    <TableCell>
                      <Badge
                        className={`py-1 px-3 ${
                          orderItem?.orderStatus === "pending"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : orderItem?.orderStatus === "confirmed"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : orderItem?.orderStatus === "readyForPickup"
                            ? "bg-purple-500 hover:bg-purple-600"
                            : orderItem?.orderStatus === "pickedUp"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-secondary hover:bg-accent text-foreground"
                        }`}
                      >
                        {orderItem?.orderStatus === "readyForPickup"
                          ? "Ready for Pickup"
                          : orderItem?.orderStatus === "pickedUp"
                          ? "Picked up"
                          : orderItem?.orderStatus?.charAt(0).toUpperCase() + orderItem?.orderStatus?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`py-1 px-3 ${
                          orderItem?.paymentStatus === "paid"
                            ? "bg-green-500 hover:bg-green-600"
                            : orderItem?.paymentStatus === "failed"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                      >
                        {orderItem?.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deadlineStatus ? (
                        <div className="flex items-center gap-2">
                          <Clock className={`h-4 w-4 ${
                            deadlineStatus.isExpired
                              ? "text-red-600"
                              : deadlineStatus.isUrgent
                              ? "text-orange-600"
                              : deadlineStatus.isWarning
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                          }`} />
                          <span className={`text-sm ${
                            deadlineStatus.isExpired
                              ? "text-red-600 font-semibold"
                              : deadlineStatus.isUrgent
                              ? "text-orange-600 font-semibold"
                              : deadlineStatus.isWarning
                              ? "text-yellow-600 font-semibold"
                              : "text-muted-foreground"
                          }`}>
                            {deadlineStatus.isExpired
                              ? "Expired"
                              : deadlineStatus.isUrgent
                              ? `${deadlineStatus.hoursRemaining}h left`
                              : deadlineStatus.deadline.toLocaleDateString()}
                          </span>
                          {(deadlineStatus.isExpired || deadlineStatus.isUrgent || deadlineStatus.isWarning) && (
                            <AlertTriangle className={`h-4 w-4 ${
                              deadlineStatus.isExpired
                                ? "text-red-600"
                                : deadlineStatus.isUrgent
                                ? "text-orange-600"
                                : "text-yellow-600"
                            }`} />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>₱{orderItem?.totalAmount}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleFetchOrderDetails(orderItem?._id)
                          }
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPayment(orderItem?._id)}
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                        {canCancelOrder(orderItem?.orderStatus) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(orderItem?._id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                      <Dialog
                        open={openDetailsDialog}
                        onOpenChange={() => {
                          setOpenDetailsDialog(false);
                          dispatch(resetOrderDetails());
                        }}
                      >
                        <ShoppingOrderDetailsView orderDetails={orderDetails} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default ShoppingOrders;
