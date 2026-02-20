import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RegistrationSuccess from "../pages/auth/RegistrationSuccess";
import MainDashboard from "../pages/dashboard/MainDashboard";
import MemberProfile from "../pages/profile/MemberProfile";
import ContributionHistory from "../pages/history/ContributionHistory";
import LoanHistory from "../pages/loans/LoanHistory";
import LoanRequest from "../pages/loans/LoanRequest";
import AdminDashboard from "../pages/admin/AdminDashboard";
import GroupDetails from "../pages/groups/GroupDetails";
import Notifications from "../pages/notifications/Notifications";
import Settings from "../pages/settings/Settings";
import HelpCenter from "../pages/help/HelpCenter";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Terms from "../pages/legal/Terms";
import Privacy from "../pages/legal/Privacy";
import Cards from "../pages/payments/Cards";  // ← Add this line

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
    path: "/registration-success",
    element: <RegistrationSuccess />,
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
  {
    path: "/group/:groupId",
    element: <GroupDetails />,
  },
  {
    path: "/notifications",
    element: <Notifications />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/help",
    element: <HelpCenter />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/cards",           // ← Add this route
    element: <Cards />,
  },
]);

export default router;