import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllActivityLogs,
} from "@/store/superadmin/activity-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  FilePlus,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ActivityLogs() {
  const dispatch = useDispatch();
  const { activityLogs, isLoading, pagination } = useSelector(
    (state) => state.activity
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadActivityLogs();
  }, [dispatch, currentPage]);

  const loadActivityLogs = () => {
    dispatch(
      getAllActivityLogs({
        page: currentPage,
        limit: 50,
      })
    );
  };

  const getActionBadge = (action) => {
    const styles = {
      add: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      edit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      archive: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      unarchive: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    const icons = {
      add: <FilePlus className="w-3 h-3 mr-1" />,
      edit: <FileEdit className="w-3 h-3 mr-1" />,
      archive: <Archive className="w-3 h-3 mr-1" />,
      unarchive: <ArchiveRestore className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge className={`${styles[action]} flex items-center w-fit`}>
        {icons[action]}
        {action.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderChanges = (log) => {
    // For add actions, show what was added
    if (log.action === "add") {
      if (log.changes && typeof log.changes === "object") {
        const fields = Object.keys(log.changes).filter(
          (key) => key !== "old" && key !== "new" && log.changes[key] !== null
        );
        if (fields.length > 0) {
          return (
            <div className="space-y-1 text-sm">
              {fields.slice(0, 3).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="font-medium capitalize text-muted-foreground">
                    {key}:
                  </span>
                  <span>{String(log.changes[key])}</span>
                </div>
              ))}
              {fields.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{fields.length - 3} more
                </span>
              )}
            </div>
          );
        }
      }
      return <span className="text-sm text-muted-foreground">New product added</span>;
    }

    // For edit actions, show before/after
    if (log.action === "edit" && log.changes?.old && log.changes?.new) {
      const changedFields = Object.keys(log.changes.new);
      if (changedFields.length === 0) return null;

      return (
        <div className="space-y-1.5 text-sm">
          {changedFields.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-medium capitalize text-muted-foreground min-w-[80px]">
                {key}:
              </span>
              <span className="text-red-600 line-through dark:text-red-400">
                {String(log.changes.old[key] || "-")}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-green-600 font-medium dark:text-green-400">
                {String(log.changes.new[key] || "-")}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // For archive/unarchive
    if (log.action === "archive" || log.action === "unarchive") {
      return (
        <span className="text-sm text-muted-foreground">
          Status: {log.changes?.status || log.action}
        </span>
      );
    }

    return <span className="text-sm text-muted-foreground">-</span>;
  };

  const getProductInfo = (log) => {
    const product = log.productId || {};
    const title = log.productTitle || product.title || "Product";
    const category = product.category;
    const image = product.image || log.changes?.image || "";
    return { title, category, image };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-primary mb-2">
          Activity Logs
        </h1>
        <p className="text-muted-foreground">
          View all activities made by admins
        </p>
      </div>

      {/* Activity Table */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Activity History</CardTitle>
            {!isLoading && (
              <Badge variant="outline" className="ml-auto">
                {pagination.total} total entries
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No activity logs found
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => {
                      const { title, category, image } = getProductInfo(log);
                      return (
                        <TableRow key={log._id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {image ? (
                                  <AvatarImage src={image} alt={title} />
                                ) : (
                                  <AvatarFallback>
                                    {title?.charAt(0)?.toUpperCase() || "P"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{title}</span>
                                {category && (
                                  <span className="text-xs text-muted-foreground">
                                    {category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getActionBadge(log.action)}
                          </TableCell>
                          <TableCell className="max-w-md">
                            {renderChanges(log)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.adminName}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.adminEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(pagination.totalPages, prev + 1)
                        )
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityLogs;

