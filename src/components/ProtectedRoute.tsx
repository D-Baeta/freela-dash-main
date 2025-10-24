import React from "react";
import { Navigate } from "react-router-dom";
import { useUserContext } from "@/contexts/userContextBase";
import { LoadingWrapper } from "@/components/LoadingWrapper";

interface ProtectedRouteProps {
  children: React.ReactElement | null;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useUserContext();

  // While auth/user state is resolving, show a loading skeleton
  if (loading)
    return (
      <LoadingWrapper loading={true} error={null} onRetry={undefined}>
        {null}
      </LoadingWrapper>
    );

  // If there's no user, redirect to login
  // console.log("ProtectedRoute: user =", user);
  // if (!user) return <Navigate to="/login" replace />;

  // Authorized
  return children;
};

export default ProtectedRoute;
