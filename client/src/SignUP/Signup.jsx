import { useEffect, useState } from "react";
import "./Signup.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Galaxy from "../component/Galaxy";
import { BASE_URL } from "../lib/config";
function Signup() {
  const {user} = useSelector(store=>store.auth);
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    console.log(input);
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/user/register`,
        input,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
        setInput({
          username: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
      setInput({
        username: "",
        email: "",
        password: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, []);

  return (
    <>
    <div className="sign-can">
      <Galaxy />
       <div className="overlay"></div>
        <div className="sign-box">
          <h1 className="sign-logo">Astra</h1>
          <p className="sign-heading">
            Signup to see the Photos & Videos of your friends
          </p>
          <form onSubmit={signupHandler} className="sign-form">
            <span className="sign-span">Username</span>
            <input
              className="sign-input"
              type="text"
              name="username"
              value={input.username}
              onChange={changeEventHandler}
            />
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
                please wait
              </button>
            ) : (
              <button className="sign-btn" type="submit">
                SignUp
              </button>
            )}

            <span className="sign-s">
              Already have an account?{" "}
              <Link to="/login" className="sign-link">
                Login
              </Link>{" "}
            </span>
          </form>
        </div>
        </div>
    </>
  );
}

export default Signup;
