import { Bell, HousePlug, LogOut, Menu, ShoppingCart, UserCog, Search, Package, X } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { shoppingViewHeaderMenuItems } from "@/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { logoutUser } from "@/store/auth-slice";
import UserCartWrapper from "./cart-wrapper";
import { useEffect, useMemo, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { Label } from "../ui/label";
import ThemeToggle from "../common/theme-toggle";
import DeadlinesCalendar from "../common/DeadlinesCalendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { markAsRead, markAllAsReadByTarget, removeNotification } from "@/store/notifications/notification-slice";
import { Badge } from "../ui/badge";

function useActiveMenuChecker(location, searchParams) {
  const storedFilters = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("filters");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to parse stored filters", error);
      return null;
    }
  }, [location.pathname, location.search]);

  const activeCategory =
    searchParams.get("category") || storedFilters?.category?.[0] || null;

  return (menuItem) => {
    if (menuItem.id === "home" || menuItem.id === "search") {
      return location.pathname === menuItem.path;
    }

    if (menuItem.id === "products") {
      return location.pathname.includes("/shop/listing") && !activeCategory;
    }

    if (menuItem.path === "/shop/listing") {
      return (
        location.pathname.includes("/shop/listing") &&
        activeCategory === menuItem.id
      );
    }

    return false;
  };
}

function MenuItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isActiveMenu = useActiveMenuChecker(location, searchParams);

  function handleNavigate(getCurrentMenuItem) {
    sessionStorage.removeItem("filters");
    const currentFilter =
      getCurrentMenuItem.id !== "home" &&
      getCurrentMenuItem.id !== "products" &&
      getCurrentMenuItem.id !== "search"
        ? {
            category: [getCurrentMenuItem.id],
          }
        : null;

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    location.pathname.includes("listing") && currentFilter !== null
      ? setSearchParams(
          new URLSearchParams(`?category=${getCurrentMenuItem.id}`)
        )
      : navigate(getCurrentMenuItem.path);
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row">
      {shoppingViewHeaderMenuItems.map((menuItem) => {
        const isActive = isActiveMenu(menuItem);

        return (
        <Label
            key={menuItem.id}
          onClick={() => handleNavigate(menuItem)}
            aria-current={isActive ? "page" : undefined}
            className={`text-sm font-medium cursor-pointer transition-all duration-200 px-3 py-1 rounded-full ${
              isActive
                ? "bg-white text-primary dark:bg-accent dark:text-primary-foreground shadow"
                : "text-white dark:text-white hover:text-accent dark:hover:text-accent"
            }`}
        >
          {menuItem.id === "search" ? (
            <Search className="w-5 h-5" />
          ) : (
            menuItem.label
          )}
        </Label>
        );
      })}
    </nav>
  );
}

function DrawerMenuItems({ setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isActiveMenu = useActiveMenuChecker(location, searchParams);

  // Filter out items that should not appear in mobile view
  const itemsToHide = ["search", "pe-uniform", "souvenirs", "books", "clothing", "accessories"];
  const mobileMenuItems = shoppingViewHeaderMenuItems.filter(
    (item) => !itemsToHide.includes(item.id)
  );

  function handleNavigate(getCurrentMenuItem) {
    sessionStorage.removeItem("filters");
    const currentFilter =
      getCurrentMenuItem.id !== "home" &&
      getCurrentMenuItem.id !== "products" &&
      getCurrentMenuItem.id !== "search"
        ? {
            category: [getCurrentMenuItem.id],
          }
        : null;

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    if (location.pathname.includes("listing") && currentFilter !== null) {
      setSearchParams(
        new URLSearchParams(`?category=${getCurrentMenuItem.id}`)
      );
    } else {
      navigate(getCurrentMenuItem.path);
    }

    // Close the sidebar after navigation
    if (setOpen) {
      setOpen(false);
    }
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row">
      {mobileMenuItems.map((menuItem) => {
        const isActive = isActiveMenu(menuItem);

        return (
        <Label
            key={menuItem.id}
          onClick={() => handleNavigate(menuItem)}
            aria-current={isActive ? "page" : undefined}
            className={`text-sm font-medium cursor-pointer transition-all duration-200 px-3 py-1 rounded-full ${
              isActive
                ? "bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground"
                : "text-foreground dark:text-blue-100 hover:text-primary dark:hover:text-accent"
            }`}
        >
          {menuItem.id === "search" ? (
            <Search className="w-5 h-5" />
          ) : (
            menuItem.label
          )}
        </Label>
        );
      })}
    </nav>
  );
}

function CartButton() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const [openCartSheet, setOpenCartSheet] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCartItems(user?.id));
    }
  }, [dispatch, user?.id]);

  return (
    <TooltipProvider>
      <Tooltip>
        <Sheet open={openCartSheet} onOpenChange={() => setOpenCartSheet(false)}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenCartSheet(true)}
              variant="outline"
              size="icon"
              className="h-8 w-8 relative bg-secondary hover:bg-accent border-secondary text-foreground lg:h-10 lg:w-10"
            >
              <ShoppingCart className="w-4 h-4 lg:w-6 lg:h-6" />
              <span className="absolute top-[-4px] right-[1px] font-bold text-[10px] lg:text-sm bg-red-500 text-white rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center lg:text-xs">
                {cartItems?.length || 0}
              </span>
              <span className="sr-only">User cart</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Shopping Cart ({cartItems?.length || 0} items)</p>
          </TooltipContent>
          <UserCartWrapper
            setOpenCartSheet={setOpenCartSheet}
            cartItems={
              cartItems && cartItems.length > 0
                ? cartItems
                : []
            }
          />
        </Sheet>
      </Tooltip>
    </TooltipProvider>
  );
}

function NotificationDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications } = useSelector((state) => state.notifications);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const userNotifications = useMemo(
    () => notifications.filter((notification) => notification.target === "user"),
    [notifications]
  );

  const unreadCount = useMemo(
    () => userNotifications.filter((notification) => !notification.read).length,
    [userNotifications]
  );

  function formatTimeAgo(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  function handleNotificationClick(notification) {
    dispatch(markAsRead(notification.id));
    setNotificationOpen(false);
    if (notification.orderId) {
      navigate(`/shop/account?tab=orders&orderId=${notification.orderId}`);
    } else {
      navigate("/shop/account?tab=orders");
    }
  }

  function handleRemoveNotification(notificationId, e) {
    e.stopPropagation();
    dispatch(removeNotification(notificationId));
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    dispatch(markAllAsReadByTarget("user"));
  }

  return (
    <Tooltip>
      <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 relative bg-secondary hover:bg-accent border-secondary text-foreground lg:h-10 lg:w-10"
            >
              <Bell className="w-4 h-4 lg:w-6 lg:h-6" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center p-0 text-[10px] lg:text-xs bg-red-500 text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Order Notifications</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Order Notifications</p>
        </TooltipContent>
        <DropdownMenuContent side="bottom" align="end" className="w-80">
          <div className="flex items-center justify-between p-2 border-b">
            <DropdownMenuLabel className="p-0">Order Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {userNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                You're all caught up!
              </div>
            ) : (
              userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-secondary/20 transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => handleRemoveNotification(notification.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {userNotifications.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/shop/account?tab=orders")}
                className="w-full"
              >
                View my orders
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
}

function HeaderRightContent() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
  }

  return (
    <TooltipProvider>
      <div className="flex lg:items-center lg:flex-row flex-col gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <ThemeToggle className="bg-secondary hover:bg-accent border-secondary text-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toggle Theme</p>
          </TooltipContent>
        </Tooltip>
        
        <NotificationDropdown />

        <DeadlinesCalendar />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigate("/shop/account?tab=orders")}
              variant="outline"
              size="icon"
              className="bg-secondary hover:bg-accent border-secondary text-foreground"
            >
              <Package className="w-6 h-6" />
              <span className="sr-only">Orders</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>View Orders</p>
          </TooltipContent>
        </Tooltip>
        
        <CartButton />

        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="bg-primary border-2 border-secondary hover:border-accent transition-colors cursor-pointer">
                  <AvatarFallback className="bg-primary text-secondary font-extrabold">
                    {user?.userName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-56">
                <DropdownMenuLabel>Logged in as {user?.userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/shop/account")}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Account Menu</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function MobileHeaderActions() {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <NotificationDropdown />
        <DeadlinesCalendar />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigate("/shop/search")}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-secondary hover:bg-accent border-secondary text-foreground"
            >
              <Search className="w-4 h-4" />
              <span className="sr-only">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Search Products</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigate("/shop/account?tab=orders")}
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-secondary hover:bg-accent border-secondary text-foreground"
            >
              <Package className="w-4 h-4" />
              <span className="sr-only">Orders</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>View Orders</p>
          </TooltipContent>
        </Tooltip>
        <CartButton />
      </div>
    </TooltipProvider>
  );
}

function MobileProfileSection() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
  }

  return (
    <div className="mb-6 pb-6 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar className="bg-primary border-2 border-secondary hover:border-accent transition-colors cursor-pointer">
              <AvatarFallback className="bg-primary text-secondary font-extrabold">
                {user?.userName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Logged in as</span>
              <span className="text-base font-semibold text-foreground">{user?.userName}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-56">
          <DropdownMenuLabel>Logged in as {user?.userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/shop/account")}>
            <UserCog className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MobileDrawerContent() {
  return (
    <div className="mt-6 pt-6 border-t border-border">
      <ThemeToggle className="bg-secondary hover:bg-accent border-secondary text-foreground" />
    </div>
  );
}

function ShoppingHeader() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  return (
    <header className="fixed top-0 z-40 w-full border-b bg-gradient-to-r from-[#0a1f3f] via-[#0b2752] to-[#0c2f65] dark:from-primary dark:via-secondary/30 dark:to-primary shadow-lg">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/shop/home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="/buksu_bukidnon_state_university_logo.jpg"
              alt="BukSu EEU Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-white dark:text-white text-lg tracking-wide">
            BukSu EEU
          </span>
        </Link>
        
        {/* Mobile: Search, Cart, and Hamburger menu grouped together */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <MobileHeaderActions />
          <Sheet open={openMobileMenu} onOpenChange={setOpenMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-secondary hover:bg-accent border-secondary text-foreground">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle header menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs">
              <MobileProfileSection />
              <DrawerMenuItems setOpen={setOpenMobileMenu} />
              <MobileDrawerContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: Menu items */}
        <div className="hidden lg:block">
          <MenuItems />
        </div>

        {/* Desktop: Right content */}
        <div className="hidden lg:block">
          <HeaderRightContent />
        </div>
      </div>
    </header>
  );
}

export default ShoppingHeader;
