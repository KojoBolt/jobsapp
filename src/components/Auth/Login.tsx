import Logo from "../../assets/images/job-logo.png";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { motion } from "framer-motion";
import Hero from "../../assets/images/login-front.webp";
import { useState } from "react";
import { supabase } from "../../integrations/supabase/client";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import SoftBackdrop from "../../components/hompage/SoftBackdrop";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) setServerError(error.message);
};

function Login() {
  const heading = "Welcome back";
  const words = heading.split("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = (values: { email: string; password: string }) => {
    const result = loginSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setIsLoading(true);

    if (!validateForm({ email, password })) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setServerError("No user returned from login.");
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      // fallback to dashboard if profile fetch fails
      navigate("/dashboard", { replace: true });
      return;

    }

    const role = profile?.role ?? "client";
    const onboardingCompleted = profile?.onboarding_completed ?? false;
    
    // Redirect new users to onboarding, existing users to dashboard/admin
    if (!onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");

    if (!resetEmail.trim()) {
      setResetMessage("Please enter your email address");
      setResetLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setResetMessage(`Error: ${error.message}`);
      setResetLoading(false);
      return;
    }

    setResetMessage("Password reset email sent! Check your inbox.");
    setResetLoading(false);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetEmail("");
      setResetMessage("");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SoftBackdrop />
      {/* Left section */}
      <motion.img
        src={Hero}
        className="w-[40%] ml-5 relative overflow-hidden m-1 rounded-[23px] object-cover h-[98vh] hidden md:block lg:block"
        initial={{ x: -80, opacity: 0, filter: "brightness(0.5)" }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      <p className="absolute top-8 left-8 tracking-widest text-gray-100 font-poppins text-[18px] uppercase hidden md:block lg:block">
        Unlock Your Career
      </p>
      <div className="absolute bottom-14 left-10 text-white hidden md:block lg:block">
        <h1 className="text-5xl font-serif leading-tight">
          Get <br /> Everything <br /> You Want
        </h1>
        <p className="text-sm text-gray-300 mt-4 max-w-xs">
          You can land your dream job if you automate applications, trust our AI, and stick to the process.
        </p>
      </div>

      {/* Right section */}
      <div className="w-full md:w-[60%] lg:w-[60%] p-8">
        <div>
          <img src={Logo} alt="Job App Logo" className="w-30 h-10 mx-auto mb-4" />
        </div>
        <div className="text-center mt-10">
          <h2
            style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", color: "white", fontFamily: "Merriweather", overflow: "hidden", whiteSpace: "nowrap" }}
          >
            {words.map((word, index) => (
              <motion.span
                key={index}
                initial={{ filter: "blur(1px)", opacity: 0, y: 12 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
              >
                {word}
              </motion.span>
            ))}
          </h2>
          <p className="text-gray-400">Enter Your Email and Password to access your account</p>
        </div>
        <div className="mt-8 w-[60%] mx-auto">
          <form onSubmit={handleLogin}>
            {serverError && (
              <div className="mb-4 text-red-600 text-sm font-medium text-center">
                {serverError}
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  validateForm({ email: v, password });
                }}
                className="mt-1 block w-full px-3 py-3 bg-gray-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                required
              />
              {touched.email && errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPassword(v);
                    validateForm({ email, password: v });
                  }}
                  className="block w-full px-3 py-3 pr-10 bg-gray-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
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
              {touched.password && errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <div className="flex flex-col md:flex-row md:items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-200">Remember me</label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-blue-800 text-sm font-bold mt-2 md:mt-0 md:ml-auto hover:underline focus:outline-none"
              >
                Forget Password
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-800 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
            <div className="mt-4">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full bg-white text-black py-3 border border-gray-200 shadow-sm px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <FcGoogle className="inline-block mr-2" size={20} />
                Login with Google
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 w-full text-center">
          <p className="text-white text-center">
            Do you not have an account? <a href="/sign-up" className="text-blue-500 hover:underline">Sign up</a>
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-900 rounded-lg p-8 w-96 shadow-xl border border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetEmail("");
                    setResetMessage("");
                  }}
                  className="text-gray-400 hover:text-white text-2xl leading-none focus:outline-none"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handlePasswordReset}>
                <p className="text-gray-300 text-sm mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <div className="mb-4">
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-200 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {resetMessage && (
                  <div className={`mb-4 p-3 rounded text-sm ${
                    resetMessage.includes("Error") 
                      ? "bg-red-900 text-red-200" 
                      : "bg-green-900 text-green-200"
                  }`}>
                    {resetMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetEmail("");
                      setResetMessage("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;