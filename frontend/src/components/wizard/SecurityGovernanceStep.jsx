import { useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

const controls = [
  { id: "IAM-01", domain: "Identity", title: "Identity and access governance", description: "Apply least-privilege access and managed identities to platform resources.", field: "enableIdentityGovernance", levels: { Development: "Required", Testing: "Required", Production: "Mandatory" } },
  { id: "NET-01", domain: "Network", title: "Private network access", description: "Connect AI services through private endpoints and private DNS.", field: "enablePrivateEndpoint", levels: { Development: "Optional", Testing: "Required", Production: "Mandatory" } },
  { id: "NET-02", domain: "Network", title: "Disable public network exposure", description: "Prevent direct public access to AI workload resources.", field: "disablePublicExposure", levels: { Development: "Allowed", Testing: "Allowed", Production: "Disabled" } },
  { id: "DAT-02", domain: "Data", title: "Data and workload protection", description: "Enable protection, recovery and retention controls for workload data.", field: "enableBackup", levels: { Development: "Recommended", Testing: "Required", Production: "Mandatory" } },
  { id: "AI-01", domain: "Responsible AI", title: "Model governance and traceability", description: "Require an approved model identity and traceable deployment version.", field: "enableModelGovernance", levels: { Development: "Required", Testing: "Required", Production: "Mandatory" } },
  { id: "OPS-01", domain: "Operations", title: "Central monitoring and alerting", description: "Collect workload metrics, logs and operational health signals.", field: "enableMonitoring", levels: { Development: "Recommended", Testing: "Required", Production: "Mandatory" } },
  { id: "BCM-02", domain: "Resilience", title: "Availability-zone resilience", description: "Use zone-aware deployment where the selected Azure region supports it.", field: "enableAvailabilityZone", levels: { Development: "Optional", Testing: "Recommended", Production: "Required" } },
];

const levelStyles = {
  Mandatory: { color: "#b42318", bgcolor: "#fef3f2", borderColor: "#fecdca" },
  Disabled: { color: "#b42318", bgcolor: "#fef3f2", borderColor: "#fecdca" },
  Required: { color: "#175cd3", bgcolor: "#eff8ff", borderColor: "#b2ddff" },
  Recommended: { color: "#027a48", bgcolor: "#ecfdf3", borderColor: "#abefc6" },
  Optional: { color: "#475467", bgcolor: "#f9fafb", borderColor: "#d0d5dd" },
  Allowed: { color: "#027a48", bgcolor: "#ecfdf3", borderColor: "#abefc6" },
};

const isEnforced = (level) => ["Required", "Mandatory", "Disabled"].includes(level);

function SecurityGovernanceStep({ deploymentRequest, setDeploymentRequest }) {
  const environment = deploymentRequest.environment || "Development";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeploymentRequest((current) => {
        const next = { ...current };
        controls.forEach((control) => {
          if (!isEnforced(control.levels[environment])) return;
          if (control.field === "disablePublicExposure") next.enablePublicIP = false;
          else next[control.field] = true;
        });
        return next;
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [environment, setDeploymentRequest]);

  const isChecked = (control) => control.field === "disablePublicExposure" ? !deploymentRequest.enablePublicIP : Boolean(deploymentRequest[control.field]);
  const changeControl = (control, checked) => setDeploymentRequest((current) => control.field === "disablePublicExposure" ? { ...current, enablePublicIP: !checked } : { ...current, [control.field]: checked });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, flexDirection: { xs: "column", sm: "row" }, mb: 3 }}>
        <Box><Typography variant="h5">Security and governance controls</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Controls are mapped directly to the enterprise baseline for the selected environment.</Typography></Box>
        <Chip icon={<GppGoodRoundedIcon />} label={`${environment} baseline`} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>Required and mandatory controls are enforced by policy and cannot be disabled. Recommended and optional controls remain configurable.</Alert>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {controls.map((control) => {
          const level = control.levels[environment];
          const enforced = isEnforced(level);
          return (
            <Paper key={control.id} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: enforced ? "#b2ddff" : "divider", bgcolor: enforced ? "#fafdff" : "#fff", display: "flex", flexDirection: "column", minHeight: 180 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}><Chip label={control.id} size="small" sx={{ height: 22, fontFamily: "monospace", fontWeight: 700 }} /><Typography variant="caption" color="text.secondary" fontWeight={600}>{control.domain}</Typography></Box>
                <Chip label={level} size="small" variant="outlined" sx={{ height: 24, fontWeight: 600, ...levelStyles[level] }} />
              </Box>
              <FormControlLabel sx={{ mt: 2, alignItems: "flex-start", mx: 0 }} control={<Checkbox checked={isChecked(control)} disabled={enforced} onChange={(event) => changeControl(control, event.target.checked)} sx={{ p: 0, mr: 1.25 }} />} label={<Typography fontWeight={600} fontSize={14}>{control.title}</Typography>} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{control.description}</Typography>
              {enforced && <Box sx={{ mt: "auto", pt: 1.5, display: "flex", alignItems: "center", gap: .7, color: "primary.dark" }}><LockRoundedIcon sx={{ fontSize: 15 }} /><Typography variant="caption" fontWeight={600}>Enforced by {environment} policy</Typography></Box>}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default SecurityGovernanceStep;
