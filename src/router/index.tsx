import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";  // Check if this path is correct
import MainDashboard from "../pages/dashboard/MainDashboard";
import MemberProfile from "../pages/profile/MemberProfile";
import ContributionHistory from "../pages/history/ContributionHistory";
import LoanHistory from "../pages/loans/LoanHistory";
import Register from "../pages/auth/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",           // This should be here
    element: <Login />,        // This should be here
  },
  {
    path: "/dashboard",
    element: <MainDashboard />,
  },
  {
    path: "/profile",
    element: <MemberProfile />,
  },
  {
    path: "/contributions",
    element: <ContributionHistory />,
  },
  {
    path: "/loans",
    element: <LoanHistory />,
  },
  // Add this route
{
  path: "/register",
  element: <Register />,
},
]);

export default router;