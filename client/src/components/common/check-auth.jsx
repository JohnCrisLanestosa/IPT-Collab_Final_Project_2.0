import { Navigate, useLocation } from "react-router-dom";

function CheckAuth({ isAuthenticated, user, children }) {
  const location = useLocation();

  console.log(location.pathname, isAuthenticated);

  if (location.pathname === "/") {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" />;
    } else {
      if (user?.role === "superadmin") {
        return <Navigate to="/superadmin/dashboard" />;
      } else if (user?.role === "admin") {
        return <Navigate to="/admin/products" />;
      } else {
        return <Navigate to="/shop/home" />;
      }
    }
  }

  if (
    !isAuthenticated &&
    !(
      location.pathname.includes("/login") ||
      location.pathname.includes("/register") ||
      location.pathname.includes("/forgot-password") ||
      location.pathname.includes("/reset-password")
    )
  ) {
    return <Navigate to="/auth/login" />;
  }

  if (
    isAuthenticated &&
    (location.pathname.includes("/login") ||
      location.pathname.includes("/register") ||
      location.pathname.includes("/forgot-password") ||
      location.pathname.includes("/reset-password"))
  ) {
    if (user?.role === "superadmin") {
      return <Navigate to="/superadmin/dashboard" />;
    } else if (user?.role === "admin") {
      return <Navigate to="/admin/products" />;
    } else {
      return <Navigate to="/shop/home" />;
    }
  }

  if (
    isAuthenticated &&
    user?.role !== "admin" &&
    user?.role !== "superadmin" &&
    location.pathname.includes("admin")
  ) {
    return <Navigate to="/unauth-page" />;
  }

  if (
    isAuthenticated &&
    user?.role !== "admin" &&
    user?.role !== "superadmin" &&
    location.pathname.includes("superadmin")
  ) {
    return <Navigate to="/unauth-page" />;
  }

  if (
    isAuthenticated &&
    user?.role === "admin" &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/admin/products" />;
  }

  if (
    isAuthenticated &&
    user?.role === "superadmin" &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/superadmin/dashboard" />;
  }

  if (
    isAuthenticated &&
    user?.role === "admin" &&
    location.pathname.includes("superadmin")
  ) {
    return <Navigate to="/unauth-page" />;
  }

  return <>{children}</>;
}

export default CheckAuth;
