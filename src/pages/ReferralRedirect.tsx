import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Save ref code to localStorage before redirecting to signup
      localStorage.setItem("referral_code", code);
    }
    navigate("/sign-up", { replace: true });
  }, [code, navigate]);

  return null;
};

export default ReferralRedirect;