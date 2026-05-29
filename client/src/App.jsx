import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { setSocket } from "./redux/socketSlice";
import { setOnlineUsers } from "./redux/chatSlice";
import { setLikeNotification } from "./redux/rtnSlice";
import ProtectedRoutes from "./Components/ProtectedRoutes";
import { BASE_URL } from "./lib/config";

// static imports — small, always needed
import Login from "./Login/Login";
import Signup from "./SignUP/Signup";

// dynamic imports — only loaded when the route is visited
const Main        = lazy(() => import("./main/Main"));
const Posts       = lazy(() => import("./Components/Posts"));
const Profile     = lazy(() => import("./Profile"));
const EditProfile = lazy(() => import("./Components/EditProfile/EditProfile"));
const Chat        = lazy(() => import("./Components/Chat/Chat"));
const Explore     = lazy(() => import("./Components/explore/Explore"));
const Search      = lazy(() => import("./Components/search/Search"));

// simple full-page loader shown while a chunk is downloading
const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
    <span className="material-symbols-outlined" style={{ fontSize: 40, animation: "spin 1s linear infinite" }}>
      progress_activity
    </span>
  </div>
);

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <Suspense fallback={<PageLoader />}>
          <Main />
        </Suspense>
      </ProtectedRoutes>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <Posts />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
      {
        path: "/profile/:id",
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
      {
        path: "/account/edit",
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <EditProfile />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
      {
        path: "/chat",
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <Chat />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
      {
        path: "/explore",
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <Explore />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
      {
        path: "search",
        element: (
          <ProtectedRoutes>
            <Suspense fallback={<PageLoader />}>
              <Search />
            </Suspense>
          </ProtectedRoutes>
        ),
      },
    ],
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

function App() {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      const socketio = io(BASE_URL, {
        query: { userId: user?._id },
        transports: ["websocket"],
      });
      dispatch(setSocket(socketio));

      socketio.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      socketio.on("notification", (notification) => {
        dispatch(setLikeNotification(notification));
      });

      return () => {
        socketio.close();
        dispatch(setSocket(null));
      };
    } else {
      dispatch(setSocket(null));
    }
  }, [user]);

  return (
    <>
      <RouterProvider router={browserRouter} />
      <Toaster />
    </>
  );
}

export default App;
