import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { aiModels } from "../../constants/aiModels";

const readCustomModels = () => {
  try { return JSON.parse(localStorage.getItem("customAiModels") || "[]"); }
  catch { return []; }
};

function ModelStep({ deploymentRequest, setDeploymentRequest }) {
  const [customModels, setCustomModels] = useState(readCustomModels);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", description: "" });
  const availableModels = [...aiModels, ...customModels].filter((model) => model.workload === deploymentRequest.workload);

  const selectModel = (model) => setDeploymentRequest((current) => ({ ...current, modelId: model.id, modelName: model.name }));
  const addModel = () => {
    const model = { id: form.id.trim(), name: form.name.trim(), description: form.description.trim(), workload: deploymentRequest.workload, custom: true };
    const next = [...customModels.filter((item) => item.id !== model.id), model];
    setCustomModels(next); localStorage.setItem("customAiModels", JSON.stringify(next)); selectModel(model);
    setForm({ id: "", name: "", description: "" }); setOpen(false);
  };

  return (
    <>
      <Grid container alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Grid item><Typography variant="h5">Select AI model</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .75 }}>Choose an approved model or register a custom model for this workload.</Typography></Grid>
        <Grid item><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)} disabled={!deploymentRequest.workload}>Add AI model</Button></Grid>
      </Grid>
      <Grid container spacing={2.5}>
        {availableModels.map((model) => (
          <Grid item xs={12} md={6} key={`${model.workload}-${model.id}`}>
            <Card onClick={() => selectModel(model)} sx={{ cursor: "pointer", height: "100%", border: deploymentRequest.modelId === model.id ? "2px solid #2563eb" : "1px solid #e4eaf2", bgcolor: deploymentRequest.modelId === model.id ? "#f8fbff" : "#fff", transition: ".2s", "&:hover": { borderColor: "primary.main", boxShadow: "0 8px 24px rgba(16,24,40,.08)" } }}>
              <CardContent sx={{ p: 2.5 }}><Grid container justifyContent="space-between" gap={1}><Typography variant="h6" fontSize={16}>{model.name}</Typography><Chip label={model.custom ? "Custom" : "Approved"} size="small" color={model.custom ? "secondary" : "success"} variant="outlined" /></Grid><Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>{model.description}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, fontFamily: "monospace" }}>ID: {model.id}</Typography></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Register custom AI model</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2.5, pt: "12px !important" }}>
          <Typography variant="body2" color="text.secondary">The model will be added to the selected workload catalogue in this browser. A corresponding deployment implementation must exist in the pipeline before production use.</Typography>
          <TextField required label="Model ID" placeholder="my-model-v1" value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} />
          <TextField required label="Display name" placeholder="My approved model" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextField label="Description" multiline minRows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={addModel} disabled={!form.id.trim() || !form.name.trim()}>Add and select</Button></DialogActions>
      </Dialog>
    </>
  );
}
export default ModelStep;
