import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import { getAzureDevOpsConnection, saveAzureDevOpsConnection } from "../services/api";

const emptyForm = { organization: "", project: "", azure_pipeline_id: "", aws_pipeline_id: "", branch: "refs/heads/main", pat: "" };

function AzureDevOpsOnboarding({ user }) {
  const isAdmin = user?.role === "Administrator";
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(isAdmin);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    getAzureDevOpsConnection().then((data) => {
      if (!active) return;
      setStatus(data);
      setForm((current) => ({ ...current, organization: data.organization || "", project: data.project || "", azure_pipeline_id: data.azure_pipeline_id || "", aws_pipeline_id: data.aws_pipeline_id || "", branch: data.branch || "refs/heads/main" }));
    }).catch(() => active && setMessage({ severity: "error", text: "Unable to load Azure DevOps connection status." })).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isAdmin]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setMessage(null); setSaving(true);
    try {
      const result = await saveAzureDevOpsConnection({ ...form, azure_pipeline_id: Number(form.azure_pipeline_id), aws_pipeline_id: Number(form.aws_pipeline_id) });
      setStatus(result); setForm((current) => ({ ...current, pat: "" }));
      setMessage({ severity: "success", text: `Connected Azure to “${result.pipeline_names.Azure}” and AWS to “${result.pipeline_names.AWS}”.` });
    } catch (error) {
      setMessage({ severity: "error", text: error.response?.data?.detail || "Connection verification failed." });
    } finally { setSaving(false); }
  };

  if (!isAdmin) return <Alert severity="warning">Only platform administrators can configure deployment connections.</Alert>;
  if (loading) return <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <Box><Typography variant="h4">Azure DevOps connections</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Route Azure and AWS requests to separate, cloud-specific deployment pipelines.</Typography></Box>
        <Chip icon={status?.configured ? <CheckCircleRoundedIcon /> : undefined} label={status?.configured ? "Connected" : "Setup required"} color={status?.configured ? "success" : "warning"} variant="outlined" />
      </Box>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: { xs: 2.5, md: 4 }, maxWidth: 900 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 4 }}><Box sx={{ bgcolor: "primary.light", color: "primary.dark", p: 1.2, borderRadius: 2, display: "grid" }}><VpnKeyRoundedIcon /></Box><Box><Typography variant="h6">Pipeline access</Typography><Typography variant="body2" color="text.secondary">The PAT is sent once to this backend and held only in server memory. It is never returned to the browser.</Typography></Box></Box>
        <Box component="form" onSubmit={save} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
          <TextField required label="Organization" placeholder="contoso" value={form.organization} onChange={update("organization")} helperText="From dev.azure.com/{organization}" />
          <TextField required label="Project" placeholder="AI Platform" value={form.project} onChange={update("project")} />
          <TextField required label="Azure pipeline ID" type="number" inputProps={{ min: 1 }} value={form.azure_pipeline_id} onChange={update("azure_pipeline_id")} helperText="Pipeline using azure-pipelines.yml" />
          <TextField required label="AWS pipeline ID" type="number" inputProps={{ min: 1 }} value={form.aws_pipeline_id} onChange={update("aws_pipeline_id")} helperText="Pipeline using aws-pipelines.yml" />
          <TextField required label="Repository branch" value={form.branch} onChange={update("branch")} helperText="Example: refs/heads/main" />
          <TextField required label="Personal access token" type="password" autoComplete="new-password" value={form.pat} onChange={update("pat")} helperText={status?.pat_configured ? "For security, re-enter the PAT to verify any connection update" : "Use the minimum permission required to read and run pipelines"} sx={{ gridColumn: { md: "1 / -1" } }} />
          <Box sx={{ gridColumn: { md: "1 / -1" }, display: "flex", justifyContent: "flex-end", pt: 1 }}><Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 190 }}>{saving ? "Verifying…" : "Verify and connect"}</Button></Box>
        </Box>
      </Paper>
      <Alert severity="info" sx={{ mt: 3, maxWidth: 900 }}>For production, replace in-memory PAT storage with Azure Key Vault and use a managed identity wherever your Azure DevOps setup supports it.</Alert>
    </Box>
  );
}
export default AzureDevOpsOnboarding;
