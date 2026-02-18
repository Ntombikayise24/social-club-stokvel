import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import MainDashboard from "../pages/dashboard/MainDashboard";
import MemberProfile from "../pages/profile/MemberProfile";
import ContributionHistory from "../pages/history/ContributionHistory";
import LoanHistory from "../pages/loans/LoanHistory";
import LoanRequest from "../pages/loans/LoanRequest";
import AdminDashboard from "../pages/admin/AdminDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
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
  {
    path: "/loans/request",
    element: <LoanRequest />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
]);

export default router;