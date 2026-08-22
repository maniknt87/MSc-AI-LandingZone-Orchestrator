import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Link,
  Alert,
} from "@mui/material";

import { destroyDeployment, getDeployments, retryDeployment } from "../services/api";
import DashboardCard from "../components/dashboard/DashboardCard";
import DeploymentDialog from "../deployment/DeploymentDialog";

function DeploymentDashboard() {

  const [deployments, setDeployments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cloudFilter, setCloudFilter] = useState("All");

  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [destroying, setDestroying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  // ---------------------------------------
  // Load Deployments
  // ---------------------------------------

  async function loadDeployments() {

  try {

    setLoading(true);

    const response = await getDeployments();

    setDeployments(response.deployments);

  } catch (error) {

    console.error("Failed to load deployments.", error);

  } finally {

    setLoading(false);

  }

}

  // ---------------------------------------
  // Auto Refresh
  // ---------------------------------------

  useEffect(() => {

    const initialLoad = setTimeout(loadDeployments, 0);

    const interval = setInterval(() => {

      loadDeployments();

    }, 3000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };

  }, []);

  // ---------------------------------------
  // Dashboard Statistics
  // ---------------------------------------

  const totalDeployments = deployments.length;

  const queued = deployments.filter(
    (d) => d.status === "Queued"
  ).length;

  const running = deployments.filter(
    (d) => d.status === "Running"
  ).length;

  const completed = deployments.filter(
    (d) => d.status === "Completed"
  ).length;

  const filteredDeployments = deployments.filter((deployment) => {

  const search = searchTerm.toLowerCase();

  const matchesSearch =
    deployment.deployment_id.toLowerCase().includes(search) ||
    deployment.cloud.toLowerCase().includes(search) ||
    deployment.environment.toLowerCase().includes(search) ||
    deployment.workload.toLowerCase().includes(search) ||
    deployment.status.toLowerCase().includes(search);

  const matchesCloud =
    cloudFilter === "All" ||
    deployment.cloud === cloudFilter;

  const matchesEnvironment =
    environmentFilter === "All" ||
    deployment.environment === environmentFilter;

  return (
    matchesSearch &&
    matchesCloud &&
    matchesEnvironment
  );

});

  // ---------------------------------------
  // Status Chip
  // ---------------------------------------

  function getStatusChip(status) {

    switch (status) {

      case "Queued":
        return (
          <Chip
            label="🟡 Queued"
            color="warning"
            size="small"
          />
        );

      case "Running":
        return (
          <Chip
            label="🔵 Running"
            color="info"
            size="small"
          />
        );

      case "Completed":
        return (
          <Chip
            label="🟢 Completed"
            color="success"
            size="small"
          />
        );

      case "Failed":
        return (
          <Chip
            label="🔴 Failed"
            color="error"
            size="small"
          />
        );

      default:
        return (
          <Chip
            label={status}
            size="small"
          />
        );

    }

  }

  // ---------------------------------------
// Environment Chip
// ---------------------------------------

function getEnvironmentChip(environment) {

  switch (environment) {

    case "Development":
      return (
        <Chip
          label="🟢 Development"
          color="success"
          size="small"
          variant="outlined"
        />
      );

    case "Testing":
      return (
        <Chip
          label="🟠 Testing"
          color="warning"
          size="small"
          variant="outlined"
        />
      );

    case "Production":
      return (
        <Chip
          label="🔴 Production"
          color="error"
          size="small"
          variant="outlined"
        />
      );

    default:
      return (
        <Chip
          label={environment}
          size="small"
        />
      );

  }

}
  
  function handleRowClick(deployment) {

  setSelectedDeployment(deployment);

  setOpenDialog(true);

  }

  async function handleDestroy(deployment) {
    const confirmed = window.confirm(
      `Destroy all resources for ${deployment.deployment_id}? The Terraform state and retained model artifacts will remain.`
    );
    if (!confirmed) return;
    try {
      setDestroying(true);
      setActionMessage(null);
      const response = await destroyDeployment(deployment.deployment_id);
      setActionMessage({ severity: "success", text: response.message });
      setOpenDialog(false);
      await loadDeployments();
    } catch (error) {
      setActionMessage({
        severity: "error",
        text: error.response?.data?.detail || "Unable to queue the destroy pipeline.",
      });
    } finally {
      setDestroying(false);
    }
  }

  async function handleRetry(deployment) {
    const confirmed = window.confirm(
      `Start a fresh retry for ${deployment.deployment_id} using its original deployment parameters?`
    );
    if (!confirmed) return;
    try {
      setRetrying(true);
      setActionMessage(null);
      const response = await retryDeployment(deployment.deployment_id);
      setActionMessage({ severity: "success", text: response.message });
      setOpenDialog(false);
      await loadDeployments();
    } catch (error) {
      setActionMessage({
        severity: "error",
        text: error.response?.data?.detail || "Unable to queue the deployment retry.",
      });
    } finally {
      setRetrying(false);
    }
  }

  return (

    <Box>

      <Box sx={{ mb: 3 }}><Typography variant="h4">Deployments</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Track landing-zone pipeline activity and deployment health.</Typography></Box>

      {actionMessage && <Alert severity={actionMessage.severity} sx={{ mb: 2 }}>{actionMessage.text}</Alert>}

      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >

        <Grid item xs={12} md={3}>
          <DashboardCard
            title="Total Deployments"
            value={totalDeployments}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DashboardCard
            title="Queued"
            value={queued}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DashboardCard
            title="Running"
            value={running}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DashboardCard
            title="Completed"
            value={completed}
          />
        </Grid>

      </Grid>

      <TextField
  fullWidth
  label="Search Deployments"
  placeholder="Search by ID, Cloud, Environment, Workload or Status..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  sx={{ mb: 3 }}
/>
<Grid
  container
  spacing={2}
  sx={{ mb: 3 }}
>

  <Grid item xs={12} md={6}>

    <FormControl fullWidth>

      <InputLabel>
        Cloud
      </InputLabel>

      <Select
        value={cloudFilter}
        label="Cloud"
        onChange={(e) => setCloudFilter(e.target.value)}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Azure">Azure</MenuItem>
        <MenuItem value="AWS">AWS</MenuItem>
      </Select>

    </FormControl>

  </Grid>

  <Grid item xs={12} md={6}>

    <FormControl fullWidth>

      <InputLabel>
        Environment
      </InputLabel>

      <Select
        value={environmentFilter}
        label="Environment"
        onChange={(e) => setEnvironmentFilter(e.target.value)}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Development">Development</MenuItem>
        <MenuItem value="Testing">Testing</MenuItem>
        <MenuItem value="Production">Production</MenuItem>
      </Select>

    </FormControl>

  </Grid>

</Grid>
  
      <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", boxShadow: "0 8px 28px rgba(16,24,40,.04)", overflowX: "auto" }}>
        {loading ? (

  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    sx={{ py: 6 }}
  >

    <CircularProgress />

  </Box>

) : (

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Cloud</b></TableCell>
              <TableCell><b>Environment</b></TableCell>

              <TableCell><b>Region</b></TableCell>

              <TableCell><b>Workload</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Pipeline run</b></TableCell>
              <TableCell><b>Created</b></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

  {filteredDeployments.length === 0 ? (

    <TableRow>

      <TableCell
        colSpan={8}
        align="center"
        sx={{ py: 5 }}
      >

        <Typography
          variant="h6"
          color="text.secondary"
        >
          📦 No deployments found
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Create your first deployment using the
          New Deployment page.
        </Typography>

      </TableCell>

    </TableRow>

  ) : (

    filteredDeployments.map((deployment) => (

  <TableRow
    key={deployment.deployment_id}
    hover
    sx={{ cursor: "pointer" }}
    onClick={() => handleRowClick(deployment)}
  >

    <TableCell>{deployment.deployment_id}</TableCell>

    <TableCell>{deployment.cloud}</TableCell>

    <TableCell>
      {getEnvironmentChip(deployment.environment)}
    </TableCell>

    <TableCell>{deployment.region}</TableCell>

    <TableCell>{deployment.workload}</TableCell>

    <TableCell>
      {getStatusChip(deployment.status)}
    </TableCell>

    <TableCell>
      {deployment.pipeline_url ? (
        <Link
          href={deployment.pipeline_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          #{deployment.pipeline_run_id || deployment.pipeline_id}
        </Link>
      ) : (
        deployment.pipeline_run_id || deployment.pipeline_id
      )}
    </TableCell>

    <TableCell>{deployment.created_time}</TableCell>

  </TableRow>

))

  )}

      </TableBody>

        </Table>
        )}
      </Paper>
        <DeploymentDialog
  open={openDialog}
  deployment={selectedDeployment}
  onClose={() => setOpenDialog(false)}
  onDestroy={handleDestroy}
  destroying={destroying}
  onRetry={handleRetry}
  retrying={retrying}
/>
    </Box>

  );

}

export default DeploymentDashboard;
