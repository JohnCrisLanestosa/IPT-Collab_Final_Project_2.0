import { AlignJustify, LogOut, User as UserIcon, Bell, X, ShoppingBag } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "@/store/auth-slice";
import ThemeToggle from "../common/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { markAsRead, markAllAsReadByTarget, removeNotification } from "@/store/notifications/notification-slice";
import { useMemo, useState } from "react";

function AdminHeader({ setOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.adminProfile);
  const { notifications } = useSelector((state) => state.notifications);
  const adminNotifications = useMemo(
    () => notifications.filter((notification) => (notification.target || "admin") === "admin"),
    [notifications]
  );
  const unreadCount = useMemo(
    () => adminNotifications.filter((notification) => !notification.read).length,
    [adminNotifications]
  );
  const [notificationOpen, setNotificationOpen] = useState(false);

  function handleLogout() {
    dispatch(logoutUser());
  }

  function handleNotificationClick(notification) {
    dispatch(markAsRead(notification.id));
    if (notification.orderId) {
      navigate(`/admin/orders`);
      setNotificationOpen(false);
    }
  }

  function handleMarkAllAsRead() {
    dispatch(markAllAsReadByTarget("admin"));
  }

  function handleRemoveNotification(notificationId, e) {
    e.stopPropagation();
    dispatch(removeNotification(notificationId));
  }

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

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border-b-2 border-secondary/30 shadow-sm">
      <Button onClick={() => setOpen(true)} className="lg:hidden sm:block bg-secondary hover:bg-accent">
        <AlignJustify />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="flex flex-1 justify-end items-center gap-3">
        <ThemeToggle className="bg-secondary/20 hover:bg-secondary/30" />
        
        {/* Notifications Dropdown */}
        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative bg-secondary/20 hover:bg-secondary/30">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-80">
            <div className="flex items-center justify-between p-2 border-b">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
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
            <div className="max-h-[400px] overflow-y-auto">
              {adminNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                adminNotifications.map((notification) => (
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
                          <ShoppingBag className="h-4 w-4 text-primary flex-shrink-0" />
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
            {adminNotifications.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin/orders")}
                  className="w-full"
                >
                  View all orders
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="bg-primary border-2 border-secondary hover:border-accent transition-colors cursor-pointer">
              {profile?.profilePicture ? (
                <AvatarImage src={profile.profilePicture} alt={user?.userName} />
              ) : null}
              <AvatarFallback className="bg-primary text-secondary font-extrabold">
                {user?.userName?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="w-56">
            <DropdownMenuLabel>
              {user?.userName}
              <div className="text-xs text-muted-foreground font-normal">
                {user?.role === "superadmin" ? "Super Admin" : "Admin"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
//logout button in admin header
export default AdminHeader;
