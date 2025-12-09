import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserStatistics } from "@/store/superadmin/admin-slice";
import { fetchSalesReport } from "@/store/superadmin/report-slice";
import { fetchAllProducts } from "@/store/admin/products-slice";
import {
  ShieldCheck,
  Users,
  UserCog,
  TrendingUp,
  PackageSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const { statistics, isLoading } = useSelector((state) => state.superAdmin);
  const {
    data: salesData,
    isLoading: isSalesLoading,
  } = useSelector((state) => state.superAdminReports);
  const {
    productList,
    isLoading: isProductsLoading,
  } = useSelector((state) => state.adminProducts);

  useEffect(() => {
    dispatch(getUserStatistics());
    dispatch(fetchSalesReport());
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
      }),
    []
  );

  const stats = [
    {
      title: "Total clients",
      value: statistics.totalUsers,
      icon: <Users className="h-8 w-8 text-primary" />,
      description: "Regular customers",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Admins",
      value: statistics.totalAdmins,
      icon: <UserCog className="h-8 w-8 text-secondary" />,
      description: "Admin accounts",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Super Admins",
      value: statistics.totalSuperAdmins,
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      description: "Super admin accounts",
      bgColor: "bg-blue-100 dark:bg-blue-800/20",
    },
   
  ];

  const salesOverview = salesData?.overview;
  const generatedAt = salesData?.generatedAt
    ? new Date(salesData.generatedAt).toLocaleString()
    : "—";

  const renderSalesCards = () => {
    if (isSalesLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32 w-full bg-muted/50" />
          ))}
        </div>
      );
    }

    if (!salesOverview) {
      return (
        <div className="text-sm text-muted-foreground">
          Sales data is not available yet.
        </div>
      );
    }

    const cards = [
      {
        title: "Daily Sales",
        description: "Revenue generated today",
        data: salesOverview.daily,
      },
      {
        title: "Weekly Sales",
        description: "Revenue for the current week",
        data: salesOverview.weekly,
      },
      {
        title: "Monthly Sales",
        description: "Revenue for the current month",
        data: salesOverview.monthly,
      },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-2 bg-gradient-to-br from-white to-secondary/10 dark:from-card dark:to-background">
            <CardHeader>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {card.title}
              </p>
              <CardTitle className="text-3xl font-bold">
                {currencyFormatter.format(card.data?.totalSales || 0)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {card.data?.orderCount || 0} orders • Avg{" "}
                {currencyFormatter.format(card.data?.avgOrderValue || 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderProductStatus = (product) => {
    if (product.isArchived) {
      return (
        <Badge variant="outline" className="w-fit text-amber-600 dark:text-amber-400">
          Archived
        </Badge>
      );
    }

    const isAvailable = (product.totalStock ?? 0) > 0;
    return (
      <Badge
        variant={isAvailable ? "secondary" : "outline"}
        className={`w-fit ${isAvailable ? "text-green-900 dark:text-green-300" : "text-muted-foreground"}`}
      >
        {isAvailable ? "Available" : "Out of Stock"}
      </Badge>
    );
  };

  const renderProductsSection = () => {
    if (isProductsLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-16 w-full bg-muted/50" />
          ))}
        </div>
      );
    }

    if (!productList || productList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No products found.
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => (
              <TableRow key={product._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {product.image ? (
                        <AvatarImage src={product.image} alt={product.title} />
                      ) : (
                        <AvatarFallback>
                          {product.title?.charAt(0)?.toUpperCase() || "P"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="font-medium">{product.title}</div>
                  </div>
                </TableCell>
                <TableCell>{product.category || "—"}</TableCell>
                <TableCell>
                  {currencyFormatter.format(product.price || 0)}
                </TableCell>
                <TableCell>{product.totalStock ?? 0}</TableCell>
                <TableCell>{renderProductStatus(product)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Key metrics, sales performance, and product inventory at a glance.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`${stat.bgColor} border-2 hover:shadow-lg transition-all duration-300 hover:scale-105`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {isLoading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Overview */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Sales overview</h2>
          </div>
          <Badge variant="outline">Updated {generatedAt}</Badge>
        </div>
        {renderSalesCards()}
      </div>

      {/* Product List */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            <CardTitle>All Products</CardTitle>
          </div>
          <Badge variant="secondary">
            {productList?.length || 0} product
            {productList?.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent>{renderProductsSection()}</CardContent>
      </Card>
    </div>
  );
}

export default SuperAdminDashboard;

