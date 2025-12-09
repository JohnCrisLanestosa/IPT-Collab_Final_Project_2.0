import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { forgotPassword } from "@/store/auth-slice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email) {
      toast({
        title: "Email is required",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await dispatch(forgotPassword(email)).unwrap();

      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Email sent successfully",
          description: result.message,
          variant: "success",
        });
      } else {
        toast({
          title: result.message || "Failed to send reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center space-y-4 text-blue-50">
          <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-300" />
            </div>
          </div>
        <h1 className="text-3xl font-semibold tracking-tight text-blue-50">
            Check Your Email
          </h1>
        <p className="text-blue-200">
            We've sent a password reset link to{" "}
          <span className="font-semibold text-blue-50">{email}</span>
          </p>
        <div className="bg-blue-900/40 border border-blue-700/80 rounded-lg p-4 text-sm text-left text-blue-100">
          <p className="font-semibold text-blue-50 mb-2">Next steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-100/90 marker:text-blue-200">
            <li>Check your email inbox</li>
            <li>Click the reset password link</li>
            <li>Create your new password</li>
            </ol>
          <p className="mt-3 text-xs text-blue-200">
              ⚠️ The link will expire in 1 hour for security reasons
            </p>
          </div>
        <p className="text-sm text-blue-200">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            className="text-blue-300 hover:text-blue-200 underline underline-offset-4 font-semibold"
            >
              try again
            </button>
          </p>
        </div>
        <div className="text-center">
          <Link
            to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 text-blue-50">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Forgot Password?
        </h1>
        <p className="mt-2 text-blue-200">
          No worries! Enter your email address and we'll send you a link to
          reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-blue-100">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;


