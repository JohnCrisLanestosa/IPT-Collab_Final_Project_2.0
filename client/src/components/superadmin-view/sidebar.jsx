import {
  LayoutDashboard,
  ShieldCheck,
  ShoppingBasket,
  BadgeCheck,
  BarChart3,
  Activity,
} from "lucide-react";
import { Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

const superAdminSidebarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/superadmin/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    id: "products",
    label: "Products",
    path: "/superadmin/products",
    icon: <ShoppingBasket />,
  },
  {
    id: "orders",
    label: "Orders",
    path: "/superadmin/orders",
    icon: <BadgeCheck />,
  },
  {
    id: "activity-logs",
    label: "Activity Logs",
    path: "/superadmin/activity-logs",
    icon: <Activity />,
  },
  {
    id: "reports",
    label: "Reports",
    path: "/superadmin/reports",
    icon: <BarChart3 />,
  },
  {
    id: "admins",
    label: "Manage Admins",
    path: "/superadmin/admins",
    icon: <ShieldCheck />,
  },
];

function MenuItems({ setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
    if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <nav className="mt-8 flex-col flex gap-2">
      {superAdminSidebarMenuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          onClick={() => handleNavigate(menuItem.path)}
          aria-current={
            location.pathname.startsWith(menuItem.path) ? "page" : undefined
          }
          className={`flex cursor-pointer text-xl items-center gap-2 rounded-md px-3 py-2 transition-all duration-300 ease-in-out hover:translate-x-1 hover:scale-105 hover:bg-secondary/20 dark:hover:bg-accent/20 ${
            location.pathname.startsWith(menuItem.path)
              ? "bg-secondary/30 text-primary dark:bg-accent/20 dark:text-accent"
              : "text-muted-foreground hover:text-primary dark:hover:text-accent"
          }`}
        >
          {menuItem.icon}
          <span>{menuItem.label}</span>
        </div>
      ))}
    </nav>
  );
}

function SuperAdminSideBar({ open, setOpen }) {
  const navigate = useNavigate();

  return (
    <Fragment>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b">
              <SheetTitle
                className="flex items-center gap-3 mt-4 mb-4 cursor-pointer"
                onClick={() => {
                  navigate("/superadmin/dashboard");
                  if (setOpen) {
                    setOpen(false);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-md">
                  <img
                    src="/buksu_bukidnon_state_university_logo.jpg"
                    alt="BukSu EEU Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-primary">BukSu EEU</p>
                  <p className="text-sm text-muted-foreground">Super Admin</p>
                </div>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>
      <aside className="hidden w-64 fixed left-0 top-0 h-screen flex-col border-r bg-gradient-to-b from-white to blue-50 dark:from-card dark:to-background p-6 lg:flex shadow-md z-30">
        <div
          onClick={() => navigate("/superadmin/dashboard")}
          className="flex cursor-pointer items-center gap-3 transition-all duration-300 ease-in-out hover:scale-105 text-primary"
        >
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="/buksu_bukidnon_state_university_logo.jpg"
              alt="BukSu EEU Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-2xl font-extrabold">BukSu EEU</h1>
            <p className="text-sm text-muted-foreground">Super Admin</p>
          </div>
        </div>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

export default SuperAdminSideBar;

