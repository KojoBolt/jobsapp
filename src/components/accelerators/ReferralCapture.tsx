import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Route: /ref/:code
// Stores the referral code, then sends the visitor to signup. The code is
// read back from localStorage by processReferral after they create an account.
const ReferralCapture = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("referral_code", code.trim().toUpperCase());
    }
    navigate("/signup", { replace: true });
  }, [code, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Taking you to sign up…</p>
    </div>
  );
};

export default ReferralCapture;