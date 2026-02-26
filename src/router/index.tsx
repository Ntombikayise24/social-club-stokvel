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
import Cards from "../pages/payments/Cards";
import NotFound from "../pages/NotFound";
import AuthGuard from "../components/AuthGuard";
import AboutUs from "../pages/about/AboutUs";
import Blog from "../pages/blog/Blog";
import FAQ from "../pages/faq/FAQ";

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
    element: <AuthGuard><MainDashboard /></AuthGuard>,
  },
  {
    path: "/profile",
    element: <AuthGuard><MemberProfile /></AuthGuard>,
  },
  {
    path: "/contributions",
    element: <AuthGuard><ContributionHistory /></AuthGuard>,
  },
  {
    path: "/loans",
    element: <AuthGuard><LoanHistory /></AuthGuard>,
  },
  {
    path: "/loans/request",
    element: <AuthGuard><LoanRequest /></AuthGuard>,
  },
  {
    path: "/admin",
    element: <AuthGuard requireAdmin><AdminDashboard /></AuthGuard>,
  },
  {
    path: "/group/:groupId",
    element: <AuthGuard><GroupDetails /></AuthGuard>,
  },
  {
    path: "/notifications",
    element: <AuthGuard><Notifications /></AuthGuard>,
  },
  {
    path: "/settings",
    element: <AuthGuard><Settings /></AuthGuard>,
  },
  {
    path: "/help",
    element: <AuthGuard><HelpCenter /></AuthGuard>,
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
    path: "/cards",
    element: <AuthGuard><Cards /></AuthGuard>,
  },
  {
    path: "/about",
    element: <AboutUs />,
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/faq",
    element: <FAQ />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;