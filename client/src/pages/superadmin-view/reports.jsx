import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesReport } from "@/store/superadmin/report-slice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, ListOrdered } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const rangeOptions = [
  { id: "daily", label: "Daily (last 7 days)" },
  { id: "weekly", label: "Weekly (last 8 weeks)" },
  { id: "monthly", label: "Monthly (last 6 months)" },
];

const formatNumber = (formatter, value) =>
  formatter.format(Number(value || 0));

const SummaryCard = ({ title, description, metric, meta }) => (
  <Card className="flex-1 min-w-[220px] bg-gradient-to-br from-white to-secondary/10 dark:from-card dark:to-background/60">
    <CardHeader className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <CardDescription>{description}</CardDescription>
      <CardTitle className="text-3xl font-black tracking-tight">
        {metric}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{meta}</p>
    </CardContent>
  </Card>
);

function SuperAdminReports() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [selectedRange, setSelectedRange] = useState("daily");
  const { data, isLoading } = useSelector(
    (state) => state.superAdminReports
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
      }),
    []
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    dispatch(fetchSalesReport()).unwrap().catch((message) => {
      toast({
        title: "Unable to load reports",
        description: message,
        variant: "destructive",
      });
    });
  }, [dispatch, toast]);

  const handleRefresh = () => {
    dispatch(fetchSalesReport())
      .unwrap()
      .then(() =>
        toast({
          title: "Reports refreshed",
          description: "Latest sales metrics fetched successfully.",
          variant: "success",
        })
      )
      .catch((message) =>
        toast({
          title: "Refresh failed",
          description: message,
          variant: "destructive",
        })
      );
  };

  const overview = data?.overview;
  const generatedAt = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : "—";
  const activeSeries = data?.series?.[selectedRange] || [];
  const itemsByDay = data?.itemsByDay || [];

  const renderSummaryCards = () => {
    if (isLoading || !overview) {
      return (
        <div className="flex w-full gap-4 flex-wrap">
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className="h-32 flex-1 min-w-[220px] bg-muted/50"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex w-full gap-4 flex-wrap">
        <SummaryCard
          title="Daily"
          description="Today's revenue"
          metric={formatNumber(currencyFormatter, overview?.daily?.totalSales)}
          meta={`${overview?.daily?.orderCount || 0} orders • Avg ${formatNumber(
            currencyFormatter,
            overview?.daily?.avgOrderValue || 0
          )}`}
        />
        <SummaryCard
          title="Weekly"
          description="This week's revenue"
          metric={formatNumber(currencyFormatter, overview?.weekly?.totalSales)}
          meta={`${overview?.weekly?.orderCount || 0} orders • Avg ${formatNumber(
            currencyFormatter,
            overview?.weekly?.avgOrderValue || 0
          )}`}
        />
        <SummaryCard
          title="Monthly"
          description="Revenue this month"
          metric={formatNumber(
            currencyFormatter,
            overview?.monthly?.totalSales
          )}
          meta={`${overview?.monthly?.orderCount || 0} orders • Avg ${formatNumber(
            currencyFormatter,
            overview?.monthly?.avgOrderValue || 0
          )}`}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            Sales Reports
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">Generated at {generatedAt}</Badge>
          </div>
        </div>

        <div className="flex">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {renderSummaryCards()}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Sales trends</CardTitle>
            <CardDescription>
              Compare revenue and volume across daily, weekly, or monthly
              buckets.
            </CardDescription>
          </div>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Choose range" />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full bg-muted/50" />
          ) : activeSeries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No paid orders found for this period yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Average Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSeries.map((bucket, index) => {
                  const dayItems = itemsByDay.find(
                    (day) => day.label === bucket.label
                  );

                  return (
                    <TableRow key={`${bucket.label}-${index}`}>
                      <TableCell className="font-semibold">
                        {bucket.label}
                      </TableCell>
                      <TableCell>
                        {formatNumber(currencyFormatter, bucket.totalSales)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(numberFormatter, bucket.orderCount)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(
                          currencyFormatter,
                          bucket.avgOrderValue || 0
                        )}
                      </TableCell>
                      <TableCell>
                        {formatNumber(numberFormatter, bucket.totalItems || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {dayItems ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <ListOrdered className="mr-2 h-4 w-4" />
                                View details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Items sold on {dayItems.label}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Qty</TableHead>
                                      <TableHead>Unit Price</TableHead>
                                      <TableHead>Revenue</TableHead>
                                      <TableHead>Customers</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {dayItems.items.map((item) => (
                                      <Fragment key={item.productId}>
                                        <TableRow>
                                          <TableCell className="font-medium">
                                            {item.title}
                                          </TableCell>
                                          <TableCell>
                                            {formatNumber(
                                              numberFormatter,
                                              item.quantity
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {formatNumber(
                                              currencyFormatter,
                                              item.price
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {formatNumber(
                                              currencyFormatter,
                                              item.revenue
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm font-semibold">
                                              {item.buyers?.length || 0} buyer
                                              {item.buyers?.length === 1
                                                ? ""
                                                : "s"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {item.buyers
                                                ?.slice(0, 2)
                                                .map(
                                                  (buyer) =>
                                                    buyer.userName ||
                                                    buyer.email ||
                                                    "Guest"
                                                )
                                                .join(", ")}
                                              {item.buyers &&
                                                item.buyers.length > 2 &&
                                                "…"}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                        {item.buyers && item.buyers.length > 0 && (
                                          <TableRow className="bg-muted/40">
                                            <TableCell colSpan={5}>
                                              <div className="space-y-2">
                                                {item.buyers.map((buyer) => (
                                                  <div
                                                    key={`${buyer.orderId}-${buyer.userId}`}
                                                    className="flex flex-wrap items-center justify-between text-sm"
                                                  >
                                                    <div className="flex flex-col">
                                                      <span className="font-medium">
                                                        {buyer.userName ||
                                                          buyer.email ||
                                                          "Guest"}
                                                      </span>
                                                      {buyer.email && (
                                                        <span className="text-xs text-muted-foreground">
                                                          {buyer.email}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                      {formatNumber(
                                                        numberFormatter,
                                                        buyer.quantity
                                                      )}{" "}
                                                      pcs •{" "}
                                                      {formatNumber(
                                                        currencyFormatter,
                                                        buyer.revenue
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </Fragment>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SuperAdminReports;


