import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerProfile from "@/components/shopping-view/customer-profile";
import ShoppingOrders from "@/components/shopping-view/orders";
import ShoppingPurchases from "@/components/shopping-view/purchases";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BackButton from "@/components/common/back-button";

function ShoppingAccount() {
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [defaultTab, setDefaultTab] = useState("customer-info");

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const tab = searchParams.get("tab");
    const allowedTabs = ["customer-info", "orders", "purchases"];
    if (allowedTabs.includes(tab)) {
      setDefaultTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 md:px-6 pt-4 md:pt-6">
        <BackButton fallbackPath="/shop/home" className="md:hidden" />
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-8 py-8">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center gap-4 py-6">
          <Avatar className="h-32 w-32 border-4 border-primary">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user?.userName} />
            ) : null}
            <AvatarFallback className="bg-primary text-secondary text-4xl font-extrabold">
              {user?.userName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{user?.userName || "User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
          <Tabs defaultValue={defaultTab} value={defaultTab} onValueChange={setDefaultTab}>
            <TabsList>
              <TabsTrigger value="customer-info">Customer Information</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            </TabsList>
            <TabsContent value="customer-info">
              <CustomerProfile />
            </TabsContent>
            <TabsContent value="orders">
              <ShoppingOrders />
            </TabsContent>
            <TabsContent value="purchases">
              <ShoppingPurchases />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;
