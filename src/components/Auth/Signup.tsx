import Logo from "../../assets/images/logo.png";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import SignUpImage from "../../assets/images/hero1.jpg";
import { useState } from "react";
import { supabase } from "../../integrations/supabase/client";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name is required")
    .refine((v) => v.split(/\s+/).length >= 2, "Enter first and last name (e.g., David Dadzie)"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
});

function Signup() {
  const heading = "Unlock your Dream Job";
  const words = heading.split("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = (values: { fullName: string; email: string; password: string }) => {
    const result = signupSchema.safeParse(values);
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

  const role = "client";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm({ fullName, email, password })) return;

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    // If email confirmation is disabled in Supabase, user is logged in immediately
    // If email confirmation is enabled, data.user exists but session is null
    if (data.session) {
      // Email confirmation is OFF — user is logged in, redirect to dashboard
      navigate("/dashboard", { replace: true });
    } else {
      // Email confirmation is ON — show a message to check their email
      setServerError(""); 
      setIsLoading(false);
      navigate("/email-confirmation");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left section */}
      <motion.img
        src={SignUpImage}
        className="w-[40%] ml-5 relative overflow-hidden m-1 rounded-[23px] object-cover h-[98vh] hidden md:block lg:block"
        initial={{ x: -50, opacity: 0, filter: "brightness(0.5)" }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <p className="absolute top-8 left-8 tracking-widest text-gray-100 font-poppins text-[18px] uppercase hidden md:block lg:block">
        Land Your Dream
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
      <div className="w-full md:w-[60%] lg:w-[60%] p-6">
        <div>
          <img src={Logo} alt="Job App Logo" className="w-30 h-10 mx-auto mb-4" />
        </div>

        <div className="text-center mt-10">
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              textAlign: "center",
              color: "black",
              fontFamily: "Merriweather",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {words.map((char, index) => (
              <motion.span
                key={index}
                initial={{ filter: "blur(8px)", opacity: 0, y: 12 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.03 }}
              >
                {char}
              </motion.span>
            ))}
          </h2>
          <p className="text-gray-400">Enter your details to create your account</p>
        </div>

        <div className="mt-8 w-[60%] mx-auto">
          <form onSubmit={handleSignup}>
            {serverError && (
              <div className="mb-4 text-red-600 text-sm font-medium text-center">
                {serverError}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={fullName}
                onChange={(e) => {
                  const v = e.target.value;
                  setFullName(v);
                  if (errors.fullName) validateForm({ fullName: v, email, password });
                }}
                className="mt-1 block w-full px-3 py-3 bg-gray-200 rounded-md focus:outline-none sm:text-sm text-black"
                required
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  if (errors.email) validateForm({ fullName, email: v, password });
                }}
                className="mt-1 block w-full px-3 py-3 bg-gray-200 rounded-md focus:outline-none sm:text-sm text-black"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  const v = e.target.value;
                  setPassword(v);
                  if (errors.password) validateForm({ fullName, email, password: v });
                }}
                className="mt-1 block w-full px-3 py-3 bg-gray-200 rounded-md focus:outline-none sm:text-sm text-black"
                required
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="mt-4">
              <button
                type="button"
                className="w-full bg-white text-black py-3 border border-gray-200 shadow-sm px-4 rounded-md hover:bg-gray-100 focus:outline-none"
              >
                <FcGoogle className="inline-block mr-2" size={20} />
                Login with Google
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 w-full text-center">
          <p className="text-black text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;