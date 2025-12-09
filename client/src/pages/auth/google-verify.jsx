import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RecaptchaComponent from "@/components/auth/recaptcha";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useDispatch } from "react-redux";
import { checkAuth } from "@/store/auth-slice";
import axios from "axios";

function GoogleVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get the temporary token from URL
  const tempToken = searchParams.get("token");
  const userType = searchParams.get("type"); // 'signup' or 'login'

  useEffect(() => {
    // If no token, redirect to login
    if (!tempToken) {
      navigate("/auth/login");
    }
  }, [tempToken, navigate]);

  const handleRecaptchaVerify = (token) => {
    setRecaptchaToken(token);
  };

  const handleContinue = async () => {
    if (!recaptchaToken) {
      toast({
        title: "Please complete the reCAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Verify reCAPTCHA and complete authentication
      const response = await axios.post(
        "http://localhost:5000/api/auth/google/verify-recaptcha",
        {
          tempToken,
          recaptchaToken,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // Check auth to update Redux state
        await dispatch(checkAuth());

        // Show success message
        const message = response.data.message || "Verification successful!";
        
        // Redirect to home with success message
        if (userType === "signup") {
          navigate(
            `/shop/home?success=signup&message=${encodeURIComponent(
              "Welcome! Your account has been created successfully with Google."
            )}`
          );
        } else {
          navigate(
            `/shop/home?success=login&message=${encodeURIComponent(
              "Welcome back! You've logged in successfully."
            )}`
          );
        }
      } else {
        toast({
          title: response.data.message || "Verification failed",
          variant: "destructive",
        });
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed. Please try again.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#041b3a] px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[#072040] p-8 shadow-2xl shadow-blue-950/50 border border-blue-900">
        {/* Success Badge */}
        {userType === "signup" ? (
          <div className="rounded-md bg-emerald-900/50 p-4 border border-emerald-500/60">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-emerald-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-100">
                  Account created successfully! 🎉
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-blue-900/60 p-4 border border-blue-600/70">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-100">
                  Authenticated successfully! ✓
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-900/60 flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-blue-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          
          {/* Dynamic Title and Message based on user type */}
          {userType === "signup" ? (
            <>
              <h2 className="text-2xl font-bold text-blue-50">
                Welcome! Registration Almost Complete
              </h2>
              <p className="mt-2 text-sm text-blue-200">
                Your Google account has been successfully created.
              </p>
              <p className="mt-1 text-sm text-blue-200">
                Please complete the security verification below to finish your registration.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-blue-50">
                Welcome Back! One More Step
              </h2>
              <p className="mt-2 text-sm text-blue-200">
                You've successfully authenticated with Google.
              </p>
              <p className="mt-1 text-sm text-blue-200">
                Please complete the security verification below to continue.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {/* reCAPTCHA */}
          <RecaptchaComponent onVerify={handleRecaptchaVerify} />

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!recaptchaToken || isVerifying}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-70 disabled:bg-blue-500"
          >
            {isVerifying ? "Verifying..." : "Continue to Home"}
          </Button>

          {/* Info Text */}
          <p className="text-center text-xs text-blue-300">
            This verification helps us ensure the security of your account
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoogleVerify;

