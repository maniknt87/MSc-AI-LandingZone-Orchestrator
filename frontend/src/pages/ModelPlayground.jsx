import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  getPlaygroundDeployments,
  getPlaygroundHistory,
  invokePlaygroundModel,
} from "../services/api";


const sampleText = "The governed Azure deployment experience was excellent.";


function errorMessage(error) {
  return error?.response?.data?.detail || error?.message || "The request failed.";
}


function ModelPlayground() {
  const [deployments, setDeployments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [text, setText] = useState(sampleText);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoking, setInvoking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = useMemo(
    () => deployments.find((item) => item.id === selectedId),
    [deployments, selectedId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [deploymentResponse, historyResponse] = await Promise.all([
        getPlaygroundDeployments(),
        getPlaygroundHistory(),
      ]);
      const items = deploymentResponse.deployments || [];
      setDeployments(items);
      setSelectedId((current) => current || items[0]?.id || "");
      setHistory(historyResponse.runs || []);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadData, 0);
    return () => clearTimeout(initialLoad);
  }, [loadData]);

  async function invokeModel() {
    if (!selectedId || !text.trim()) return;
    setInvoking(true);
    setError("");
    setNotice("");
    try {
      const response = await invokePlaygroundModel({
        deployment_id: selectedId,
        text: text.trim(),
      });
      setResult(response);
      const historyResponse = await getPlaygroundHistory();
      setHistory(historyResponse.runs || []);
    } catch (requestError) {
      setError(errorMessage(requestError));
      const historyResponse = await getPlaygroundHistory().catch(() => ({ runs: history }));
      setHistory(historyResponse.runs || []);
    } finally {
      setInvoking(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setNotice("Result copied to clipboard.");
  }

  function downloadResult() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inference-${result.request_id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Result downloaded.");
  }

  const confidence = result?.prediction?.confidence || 0;

  if (loading) {
    return <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4">Model playground</Typography>
          <Typography color="text.secondary" sx={{ mt: .75 }}>Test governed model endpoints without exposing credentials to the browser.</Typography>
        </Box>
        <Chip icon={<LockRoundedIcon />} label="Private endpoint via FastAPI" color="success" variant="outlined" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.15fr) minmax(360px,.85fr)" }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "primary.light", color: "primary.main" }}><AutoAwesomeRoundedIcon /></Box>
            <Box><Typography variant="h6">Run inference</Typography><Typography variant="body2" color="text.secondary">Choose a healthy deployment and provide model input.</Typography></Box>
          </Box>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>Deployment</InputLabel>
            <Select label="Deployment" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(null); }}>
              {deployments.map((deployment) => (
                <MenuItem key={deployment.id} value={deployment.id}>
                  {deployment.model_name} · {deployment.deployment_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selected && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
              <Chip size="small" label={selected.cloud} />
              <Chip size="small" label={selected.environment} />
              <Chip size="small" label={selected.workload} />
              <Chip size="small" color={selected.configured ? "success" : "warning"} label={selected.status} />
              <Chip size="small" variant="outlined" label={`v${selected.model_version}`} />
            </Box>
          )}

          <TextField
            label="Input text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={7}
            fullWidth
            inputProps={{ maxLength: 5000 }}
            helperText={`${text.length}/5000 characters`}
          />

          <Box sx={{ display: "flex", gap: 1.25, mt: 2.5 }}>
            <Button variant="contained" startIcon={invoking ? <CircularProgress size={17} color="inherit" /> : <PlayArrowRoundedIcon />} disabled={invoking || !selected?.configured || !text.trim()} onClick={invokeModel}>
              {invoking ? "Invoking…" : "Analyse sentiment"}
            </Button>
            <Button variant="outlined" onClick={() => setText(sampleText)}>Use sample</Button>
          </Box>
          {!selected?.configured && <Alert severity="warning" sx={{ mt: 2 }}>Configure the scoring URI and endpoint key in the backend environment to enable invocation.</Alert>}
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider", minHeight: 430 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box><Typography variant="h6">Prediction</Typography><Typography variant="body2" color="text.secondary">Normalized endpoint response</Typography></Box>
            {result && <Box><Button size="small" onClick={copyResult} startIcon={<ContentCopyRoundedIcon />}>Copy</Button><Button size="small" onClick={downloadResult} startIcon={<DownloadRoundedIcon />}>Download</Button></Box>}
          </Box>

          {!result ? (
            <Box sx={{ minHeight: 300, borderRadius: 3, border: "1px dashed", borderColor: "divider", display: "grid", placeItems: "center", textAlign: "center", p: 4, color: "text.secondary" }}>
              <Box><AutoAwesomeRoundedIcon sx={{ fontSize: 42, color: "#9db7e8", mb: 1 }} /><Typography fontWeight={600}>Your prediction will appear here</Typography><Typography variant="body2" sx={{ mt: .5 }}>Invoke the selected model to see confidence and latency.</Typography></Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ p: 3, borderRadius: 3, bgcolor: result.prediction.label === "POSITIVE" ? "#ecfdf3" : "#fef3f2", border: "1px solid", borderColor: result.prediction.label === "POSITIVE" ? "#abefc6" : "#fecdca" }}>
                <Typography variant="overline" color="text.secondary">Sentiment</Typography>
                <Typography variant="h4" sx={{ color: result.prediction.label === "POSITIVE" ? "#027a48" : "#b42318", mt: .5 }}>{result.prediction.label}</Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography fontWeight={600}>Confidence</Typography><Typography fontWeight={700}>{(confidence * 100).toFixed(2)}%</Typography></Box>
                <LinearProgress variant="determinate" value={confidence * 100} sx={{ height: 10, borderRadius: 10 }} />
              </Box>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Latency</Typography><Typography fontWeight={700}>{result.metrics.latency_ms} ms</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Model version</Typography><Typography fontWeight={700}>{result.deployment_name} · v{result.model_version}</Typography></Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3, wordBreak: "break-all" }}>Request ID: {result.request_id}</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ mt: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Box><Typography variant="h6">Recent tests</Typography><Typography variant="body2" color="text.secondary">Latest inference metadata; full input is not retained.</Typography></Box>
          <Button startIcon={<RefreshRoundedIcon />} onClick={loadData}>Refresh</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Input preview</TableCell><TableCell>Prediction</TableCell><TableCell>Confidence</TableCell><TableCell>Latency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {history.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>No model tests yet.</TableCell></TableRow>}
              {history.map((run) => (
                <TableRow key={run.request_id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{run.created_at}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}><Typography variant="body2" noWrap>{run.input_preview}</Typography></TableCell>
                  <TableCell>{run.prediction || "—"}</TableCell>
                  <TableCell>{run.confidence == null ? "—" : `${(run.confidence * 100).toFixed(2)}%`}</TableCell>
                  <TableCell>{run.latency_ms} ms</TableCell>
                  <TableCell><Chip size="small" color={run.status === "Succeeded" ? "success" : "error"} label={run.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}


export default ModelPlayground;
