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
import AdminOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  resetOrderDetails,
} from "@/store/admin/order-slice";
import { Badge } from "../ui/badge";
import { ArrowLeft, Trash2, Clock, AlertTriangle } from "lucide-react";

function AdminOrdersView() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { orderList, orderDetails } = useSelector((state) => state.adminOrder);
  const dispatch = useDispatch();

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetailsForAdmin(getId));
  }

  useEffect(() => {
    dispatch(getAllOrdersForAdmin(showArchived));
  }, [dispatch, showArchived]);

  console.log(orderDetails, "orderList");

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>
              {showArchived ? "Cancelled Orders" : "All Orders"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {showArchived
                ? "View orders currently stored in the recycle bin."
                : "Track and manage live customer orders."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showArchived ? (
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => setShowArchived(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowArchived(true)}
                className="flex items-center gap-2"
                aria-pressed={showArchived}
              >
                <Trash2 className="h-4 w-4" />
                Cancelled Orders
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Payment Deadline</TableHead>
              <TableHead>Order Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList && orderList.length > 0
              ? orderList.map((orderItem) => {
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
                            : orderItem?.orderStatus?.charAt(0).toUpperCase() +
                              orderItem?.orderStatus?.slice(1)}
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
                                ? "Expired - Will Cancel"
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
                      {orderItem?.isArchived ? (
                        <Badge className="bg-gray-500 hover:bg-gray-600">
                          In Recycle Bin
                        </Badge>
                      ) : orderItem?.orderStatus === "pickedUp" ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={openDetailsDialog}
                        onOpenChange={() => {
                          setOpenDetailsDialog(false);
                          dispatch(resetOrderDetails());
                        }}
                      >
                        <Button
                          onClick={() =>
                            handleFetchOrderDetails(orderItem?._id)
                          }
                        >
                          View Details
                        </Button>
                        <AdminOrderDetailsView orderDetails={orderDetails} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                  );
                })
              : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default AdminOrdersView;
