import { useEffect, useState, lazy, Suspense } from "react";
import "./Login.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "../redux/authSlice";
import { BASE_URL } from "../lib/config";

const Hyperspeed = lazy(() => import("../component/Hyperspeed"));

function Login() {
  const [input, setInput] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/user/login`,
        input,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        navigate("/");
        toast.success(res.data.message);
        setInput({ email: "", password: "" });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Login failed");
      setInput({ email: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <>
      <div className="login-can">
        <Suspense fallback={<div style={{ width: "100%", height: "100%", background: "#000" }} />}>
          <Hyperspeed
          effectOptions={{
            distortion: "turbulentDistortion",
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0xffffff, // white background
              shoulderLines: 0x000000,
              brokenLines: 0x000000,
              leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
              rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
              sticks: 0x03b3c3,
            },
          }}
          onSpeedUp={() => {}}
          onSlowDown={() => {}}
        />
        </Suspense>

        <div className="overlay"></div>
        <div className="sign-box">
          <h1 className="sign-logo">Astra</h1>
          <p className="sign-heading">
            Signup to see the Photos & Videos of your friends
          </p>
          <form onSubmit={signupHandler} className="sign-form">
            <span className="sign-span">Email</span>
            <input
              className="sign-input"
              type="email"
              name="email"
              value={input.email}
              onChange={changeEventHandler}
            />
            <span className="sign-span">Password</span>
            <input
              className="sign-input"
              type="password"
              name="password"
              value={input.password}
              onChange={changeEventHandler}
            />
            {loading ? (
              <button>
                <Loader2 className="spin" />
                Please wait
              </button>
            ) : (
              <button className="sign-btn" type="submit">
                Login
              </button>
            )}

            <span className="sign-s">
              Doesn't have an account?{" "}
              <Link to="/signup" className="sign-link">
                SignUp
              </Link>
            </span>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
