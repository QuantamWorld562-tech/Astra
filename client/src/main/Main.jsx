import "./Main.css";
import Leftsidebar from "../Leftsidebar/Leftsidebar";
import { Outlet, useLocation } from "react-router-dom";
import useGetSuggestedUsers from "../hooks/useGetSuggestedUSer";
import FloatingLines from "../component/FloatingLines";

function Main() {
  useGetSuggestedUsers();

  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="main-layout">

      {/* floating background — only on home */}
      {isHome && (
        
        <div className="floating-bg">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={8}
            lineDistance={8}
            bendRadius={8}
            bendStrength={-2}
            interactive={false}
            parallax={true}
            animationSpeed={1}
            gradientStart="#e945f5"
            gradientMid="#6f6f6f"
            gradientEnd="#6a6a6a"
          />
        </div>
      )}

      <Leftsidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Main;
