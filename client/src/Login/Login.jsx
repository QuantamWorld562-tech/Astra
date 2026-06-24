import { useEffect, useState, lazy, Suspense } from "react";
import "./Login.css";
import axios from "../lib/axiosInstance";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser, setToken } from "../redux/authSlice";
import { BASE_URL } from "../lib/config";

const Hyperspeed = lazy(() => import("../component/Hyperspeed"));

/*
  Login has 5 steps:
  1 — Enter email
  2 — Enter password (normal login)
  3 — Forgot password: enter email to receive OTP
  4 — Enter OTP
  5 — Set new password
*/

function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // ── Normal login ───────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) { toast.error("Fill all fields"); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/user/login`, { email, password }, { withCredentials: true });
      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        dispatch(setToken(res.data.token));
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — Step 1: send OTP ────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
      toast.success("OTP sent to your email");
      setOtp("");
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — Step 2: verify OTP ──────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp) { toast.error("Enter the OTP"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/verify-otp`, { email, otp });
      toast.success("OTP verified");
      setResetToken(res.data.resetToken);
      setNewPassword("");
      setConfirmPassword("");
      setStep(5);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — Step 3: reset password ──────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error("Fill all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, { resetToken, password: newPassword });
      toast.success("Password reset successfully");
      setStep(1);
      setEmail(""); setPassword(""); setOtp("");
      setNewPassword(""); setConfirmPassword(""); setResetToken("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Session expired. Please start over.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-can">
      <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#000" }} />}>
        <Hyperspeed
          effectOptions={{
            distortion: "turbulentDistortion", length: 400, roadWidth: 10,
            islandWidth: 2, lanesPerRoad: 4, fov: 90, fovSpeedUp: 150,
            speedUp: 2, carLightsFade: 0.4, totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40, shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1, brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5], lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80], movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2], carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5], carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808, islandColor: 0x0a0a0a, background: 0xffffff,
              shoulderLines: 0x000000, brokenLines: 0x000000,
              leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
              rightCars: [0x03b3c3, 0x0e5ea5, 0x324555], sticks: 0x03b3c3,
            },
          }}
          onSpeedUp={() => {}} onSlowDown={() => {}}
        />
      </Suspense>

      <div className="overlay"></div>
      <div className="sign-box">
        <h1 className="sign-logo">Astra</h1>

        {/* ── Step 1 & 2: Normal login ── */}
        {(step === 1 || step === 2) && (
          <>
            <p className="sign-heading">Sign in to see photos & videos from your friends</p>
            <form onSubmit={handleLogin} className="sign-form">
              <span className="sign-span">Email</span>
              <input className="sign-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <span className="sign-span">Password</span>
              <input className="sign-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="forgot-link" onClick={() => setStep(3)}>Forgot password?</button>
              {loading
                ? <button type="button"><Loader2 className="spin" /> Please wait</button>
                : <button className="sign-btn" type="submit">Login</button>
              }
            </form>

            <span className="sign-s">
              Don't have an account? <Link to="/signup" className="sign-link">Sign Up</Link>
            </span>
          </>
        )}

        {/* ── Step 3: Enter email for OTP ── */}
        {step === 3 && (
          <>
            <p className="sign-heading">Enter your email to receive a reset OTP</p>
            <div className="sign-form">
              <span className="sign-span">Email</span>
              <input className="sign-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {loading
                ? <button><Loader2 className="spin" /> Sending...</button>
                : <button className="sign-btn" onClick={handleSendOtp}>Send OTP</button>
              }
              <button className="forgot-link" onClick={() => setStep(1)}>← Back to login</button>
            </div>
          </>
        )}

        {/* ── Step 4: Enter OTP ── */}
        {step === 4 && (
          <>
            <p className="sign-heading">Enter the 6-digit OTP sent to {email}</p>
            <div className="sign-form">
              <span className="sign-span">OTP</span>
              <input
                className="sign-input otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {loading
                ? <button><Loader2 className="spin" /> Verifying...</button>
                : <button className="sign-btn" onClick={handleVerifyOtp}>Verify OTP</button>
              }
              <button className="forgot-link" onClick={handleSendOtp}>Resend OTP</button>
            </div>
          </>
        )}

        {/* ── Step 5: Set new password ── */}
        {step === 5 && (
          <>
            <p className="sign-heading">Set a new password for your account</p>
            <div className="sign-form">
              <span className="sign-span">New Password</span>
              <input className="sign-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <span className="sign-span">Confirm Password</span>
              <input className="sign-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {loading
                ? <button><Loader2 className="spin" /> Resetting...</button>
                : <button className="sign-btn" onClick={handleResetPassword}>Reset Password</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
