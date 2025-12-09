import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function BackButton({ fallbackPath = "/shop/home", className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if we have location state indicating where we came from
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    
    // Always try to navigate back - React Router handles history navigation
    // If there's no history, navigate(-1) will stay on current page
    // In that case, we'll navigate to fallback as a safety measure
    const currentPath = location.pathname;
    navigate(-1);
    
    // If navigate(-1) doesn't work (we're still on the same page after a moment),
    // navigate to fallback. This uses a small delay to check.
    setTimeout(() => {
      if (window.location.pathname === currentPath) {
        navigate(fallbackPath);
      }
    }, 50);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}

export default BackButton;


