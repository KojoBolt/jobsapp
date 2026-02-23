import Logo from "../../assets/images/logo.png";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import Hero from "../../assets/images/login.jpg";
import { useState } from "react";
import { supabase } from "../../integrations/supabase/client";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function Login() {
  const heading = "Welcome back";
  const words = heading.split("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
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
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      // fallback to dashboard if profile fetch fails
      navigate("/dashboard", { replace: true });
      return;
    
    }
    

    const role = profile?.role ?? "client";
    navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
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
            style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", color: "black", fontFamily: "Merriweather", overflow: "hidden", whiteSpace: "nowrap" }}
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                onChange={(e) => {
                  const v = e.target.value;
                  setPassword(v);
                  validateForm({ email, password: v });
                }}
                className="mt-1 block w-full px-3 py-3 bg-gray-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                required
              />
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
                <label htmlFor="remember" className="ml-2 text-sm text-gray-900">Remember me</label>
              </div>
              <a href="#" className="text-blue-800 text-sm font-bold mt-2 md:mt-0 md:ml-auto">
                Forget Password
              </a>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
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
                className="w-full bg-white text-black py-3 border border-gray-200 shadow-sm px-4 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <FcGoogle className="inline-block mr-2" size={20} />
                Login with Google
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 w-full text-center">
          <p className="text-black text-center">
            Do you not have an account? <a href="/sign-up" className="text-blue-500 hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;