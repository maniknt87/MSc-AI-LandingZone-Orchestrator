import { useState } from "react";
import Alert from "@mui/material/Alert";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault(); setError("");
    if (!username || !password) return setError("Enter your username and password.");
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) return setError(data.detail || "Invalid username or password.");
      localStorage.setItem("accessToken", data.access_token); localStorage.setItem("currentUser", JSON.stringify(data.user)); onLogin(data.user);
    } catch { setError("The platform API is unavailable. Check that the backend is running."); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr .9fr" }, bgcolor: "#f5f7fb" }}>
      <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", p: { md: 6, lg: 9 }, color: "white", background: "radial-gradient(circle at 15% 15%,rgba(59,130,246,.35),transparent 30%),radial-gradient(circle at 85% 80%,rgba(139,92,246,.3),transparent 30%),#0d1830" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, maxWidth: 620 }}><Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: 2.5, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}><AutoAwesomeRoundedIcon /></Box><Typography fontWeight={700} fontSize={17.6} lineHeight={1.35}>Cloud-Agnostic Landing Zone for Secure AI Model Deployment</Typography></Box>
        <Box sx={{ width: "100%", textAlign: "center" }}><Typography sx={{ mx: "auto", maxWidth: 720, fontWeight: 700, fontSize: { md: 40, lg: 50 }, lineHeight: 1.12, letterSpacing: '-.045em' }}>Build secure, governed AI platforms with automated deployment.</Typography><Typography sx={{ mx: "auto", mt: 3, maxWidth: 720, color: "#aab6cf", fontSize: 18, lineHeight: 1.7, textAlign: "center" }}>One self-service experience for landing zones, policy validation, Terraform automation and AI workload deployment.</Typography><Box sx={{ width: "fit-content", mx: "auto", mt: 4, display: "grid", gap: 1.5, textAlign: "left" }}>{["Policy checks before every deployment", "Private-by-default cloud architecture", "Auditable Azure DevOps delivery"].map((item) => <Box key={item} sx={{ display: "flex", gap: 1.2, alignItems: "center", color: "#d7dfef" }}><CheckCircleRoundedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />{item}</Box>)}</Box><Box sx={{ width: "100%", mt: 4, px: 2, py: 1.5, borderRadius: 2, border: "1px solid rgba(96,165,250,.25)", bgcolor: "rgba(59,130,246,.08)", color: "#bfdbfe", fontSize: 13, fontWeight: 600, letterSpacing: ".01em", textAlign: "center" }}>Policy &amp; Governance → Landing Zone → Terraform → CI/CD → AI Model</Box></Box>
        <Typography variant="caption" sx={{ color: "#7584a2" }}>MSc Capstone Project · Secure AI Landing Zone</Typography>
      </Box>
      <Box sx={{ display: "grid", placeItems: "center", p: 3 }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 440, p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(16,24,40,.10)" }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "flex-start", gap: 1, mb: 4 }}><AutoAwesomeRoundedIcon color="primary" /><Typography fontWeight={700} fontSize={14.3} lineHeight={1.35}>Cloud-Agnostic Landing Zone for Secure AI Model Deployment</Typography></Box>
          <Typography variant="h4">Welcome back</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Sign in to manage your cloud landing zones.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleLogin} sx={{ display: "grid", gap: 2.5 }}>
            <TextField fullWidth label="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            <TextField fullWidth label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 1, py: 1.35 }}>{loading ? "Signing in…" : "Sign in"}</Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3, textAlign: "center" }}>Access is governed by platform role-based controls.</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
export default Login;
