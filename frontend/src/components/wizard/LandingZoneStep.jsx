import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ListItemText from "@mui/material/ListItemText";
import { approvedComputeSizes, computeSizes } from "../../constants/computeSizes";

const fields = [
  ["deploymentName", "Landing zone name", "customer-ai-platform"],
  ["hubAddressSpace", "Hub address space", "10.0.0.0/16"],
  ["generalSpokeAddressSpace", "General spoke address space", "10.1.0.0/16"],
  ["aiSpokeAddressSpace", "AI spoke address space", "10.2.0.0/16"],
];

function LandingZoneStep({ deploymentRequest, setDeploymentRequest, computePolicy }) {
  const sizes = computeSizes[deploymentRequest.cloud] || [];
  const approvedSizes = (computePolicy || approvedComputeSizes)[deploymentRequest.cloud]?.[deploymentRequest.environment] || [];
  const isApproved = (size) => approvedSizes.includes(size);
  const update = (field, value) => {
    setDeploymentRequest((current) => ({ ...current, [field]: value }));
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Landing Zone Details</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        These values are validated by the API and passed directly to Terraform through Azure DevOps.
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        For this capstone demo, use three different private /16 networks. Example: 10.0.0.0/16, 10.1.0.0/16 and 10.2.0.0/16.
      </Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {fields.map(([field, label, placeholder]) => (
          <TextField
            key={field}
            required
            label={label}
            value={deploymentRequest[field] || ""}
            placeholder={placeholder}
            onChange={(event) => update(field, event.target.value)}
            helperText={field === "deploymentName" ? "3-30 letters, numbers or hyphens" : "Private IPv4 /16 CIDR"}
          />
        ))}
        <FormControl required sx={{ gridColumn: { md: "1 / -1" } }}>
          <InputLabel id="compute-size-label">{deploymentRequest.cloud === "AWS" ? "SageMaker instance size" : "Azure ML compute size"}</InputLabel>
          <Select labelId="compute-size-label" value={deploymentRequest.vmSize || ""} label={deploymentRequest.cloud === "AWS" ? "SageMaker instance size" : "Azure ML compute size"} onChange={(event) => update("vmSize", event.target.value)} renderValue={(value) => <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}><span>{value}</span><Typography variant="caption" color={isApproved(value) ? "success.main" : "warning.main"}>{isApproved(value) ? "✓ Approved" : "⚠ Not approved"}</Typography></Box>}>
            {sizes.map((size) => <MenuItem key={size.value} value={size.value}><ListItemText primary={size.label} secondary={size.detail} /><Typography variant="caption" color={isApproved(size.value) ? "success.main" : "warning.main"} sx={{ ml: 3, whiteSpace: "nowrap" }}>{isApproved(size.value) ? "✓ Approved" : "⚠ Not approved"}</Typography></MenuItem>)}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: .75, ml: 1.5 }}>Approved for {deploymentRequest.environment}: {approvedSizes.join(" • ")}</Typography>
        </FormControl>
        {deploymentRequest.vmSize && !isApproved(deploymentRequest.vmSize) && <Alert severity="warning" sx={{ gridColumn: { md: "1 / -1" } }}><strong>Governance warning:</strong> {deploymentRequest.vmSize} is not approved for {deploymentRequest.cloud} {deploymentRequest.environment}. The backend governance gate will block this deployment.</Alert>}
      </Box>
    </Paper>
  );
}

export default LandingZoneStep;
