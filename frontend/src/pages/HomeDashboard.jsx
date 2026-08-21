import DashboardCard from "../components/cards/DashboardCard";
import BlueprintCard from "../components/cards/BlueprintCard";
import SystemStatusCard from "../components/cards/SystemStatusCard";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function HomeDashboard() {
  return (
    <Box sx={{ padding: 4 }}>

      <Typography variant="h4" gutterBottom>
        Welcome Administrator
      </Typography>

      <Grid container spacing={3} sx={{ marginTop: 3 }}>

  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
    <DashboardCard
      icon="🚀"
      title="Provision Landing Zone"
      description="Deploy Azure or AWS Landing Zones."
    />
  </Grid>

  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
    <DashboardCard
      icon="📊"
      title="Monitor Deployments"
      description="View deployment progress."
    />
  </Grid>

  <Grid size={{ xs: 12, md: 6, lg: 3 }}>    
    <DashboardCard
      icon="📜"
      title="Deployment History"
      description="Review previous deployments."
    />
  </Grid>

  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
    <DashboardCard
      icon="🏗"
      title="Platform Architecture"
      description="View the overall solution architecture."
    />
  </Grid>
  <BlueprintCard />

<SystemStatusCard />

</Grid>

      <Typography variant="body1">
        Provision and manage Azure and AWS Landing Zones
        using Terraform and Azure DevOps.
      </Typography>

    </Box>
  );
}


export default HomeDashboard;