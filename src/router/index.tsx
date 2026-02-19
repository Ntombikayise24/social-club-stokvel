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
import GroupDetails from "../pages/groups/GroupDetails";
import ProtectedRoute from "../components/ProtectedRoute";

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
    element: (
      <ProtectedRoute>
        <MainDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <MemberProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/contributions",
    element: (
      <ProtectedRoute>
        <ContributionHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/loans",
    element: (
      <ProtectedRoute>
        <LoanHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/loans/request",
    element: (
      <ProtectedRoute>
        <LoanRequest />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute adminOnly>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/group/:groupId",
    element: (
      <ProtectedRoute>
        <GroupDetails />
      </ProtectedRoute>
    ),
  },
]);

export default router;