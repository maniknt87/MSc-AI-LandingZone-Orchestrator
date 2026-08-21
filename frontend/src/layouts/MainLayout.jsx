import { useState } from "react";

import Box from "@mui/material/Box";

import Navbar from "../components/Navbar";

import DeploymentPlanner from "../pages/DeploymentPlanner";
import DeploymentDashboard from "../pages/DeploymentDashboard";
import GovernanceCenter from "../pages/GovernanceCenter";
import UsersRoles from "../pages/UsersRoles";
import AzureDevOpsOnboarding from "../pages/AzureDevOpsOnboarding";

function MainLayout({ user, onLogout }) {

  const [currentPage, setCurrentPage] = useState("planner");

  return (

    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>

      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={onLogout}
      />

      <Box component="main" sx={{ ml: { lg: "272px" }, minHeight: "100vh", p: { xs: 2, sm: 3, xl: 4 } }}>
        <Box sx={{ maxWidth: 1440, mx: "auto" }}>

  {currentPage === "planner" && (
    <DeploymentPlanner />
  )}

  {currentPage === "dashboard" && (
    <DeploymentDashboard />
  )}

  {currentPage === "governance" && (
    <GovernanceCenter />
  )}

  {currentPage === "users" && (
    <UsersRoles />
  )}

  {currentPage === "onboarding" && (
    <AzureDevOpsOnboarding user={user} />
  )}

        </Box>
      </Box>

    </Box>

  );

}

export default MainLayout;
