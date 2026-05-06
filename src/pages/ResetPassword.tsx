import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { z } from "zod";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Logo from "../assets/images/job-logo.png";
import SoftBackdrop from "../components/hompage/SoftBackdrop";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Check if user has valid session with recovery token
    const checkToken = async () => {
      try {
        const hash = window.location.hash;
        if (!hash || !hash.includes("type=recovery")) {
          setServerError("Invalid or expired reset link. Please request a new one.");
          setIsCheckingToken(false);
          return;
        }
        setIsValidToken(true);
        setIsCheckingToken(false);
      } catch (error) {
        setServerError("Error validating reset link");
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, []);

  const validateForm = (values: { password: string; confirmPassword: string }) => {
    const result = resetPasswordSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    console.log("🚫 [Validation] Errors:", fieldErrors);
    setErrors(fieldErrors);
    return false;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 [ResetPassword] Form submitted");
    setServerError("");
    setSuccessMessage("");

    if (!validateForm({ password, confirmPassword })) {
      console.log("❌ [ResetPassword] Form validation failed");
      return;
    }

    console.log("✅ [ResetPassword] Form validation passed");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      console.log("📡 [ResetPassword] API Response - Error:", error);

      if (error) {
        console.error("❌ [ResetPassword] Error updating password:", error.message);
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      console.log("✨ [ResetPassword] Password updated successfully");
      setSuccessMessage("Password reset successfully! Redirecting to login...");
      
      // Clear form
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("❌ [ResetPassword] Unexpected error:", error);
      setServerError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <SoftBackdrop />
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-gray-300">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <SoftBackdrop />
        <div className="bg-gray-900 rounded-lg p-8 w-96 border border-gray-700 text-center">
          <img src={Logo} alt="Logo" className="w-30 h-10 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-4">Invalid Reset Link</h2>
          <p className="text-gray-300 mb-6">{serverError}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <SoftBackdrop />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 shadow-xl">
          <div className="text-center mb-8">
            <img src={Logo} alt="Job App Logo" className="w-30 h-10 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-gray-400 text-sm mt-2">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-900 text-red-200 rounded-md text-sm text-center">
                {serverError}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-900 text-green-200 rounded-md text-sm text-center">
                {successMessage}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateForm({ password: e.target.value, confirmPassword });
                  }}
                  className="w-full px-3 py-3 pr-10 bg-gray-200 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) validateForm({ password, confirmPassword: e.target.value });
                  }}
                  className="w-full px-3 py-3 pr-10 bg-gray-200 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-gray-200">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (!@#$%...)</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-800 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none transition-colors text-sm"
            >
              Back to Login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
