import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import SettingsEthernetRoundedIcon from "@mui/icons-material/SettingsEthernetRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";

const navItems = [
  ["planner", "New deployment", RocketLaunchRoundedIcon],
  ["dashboard", "Deployments", SpaceDashboardRoundedIcon],
  ["playground", "Model playground", ScienceRoundedIcon],
  ["governance", "Governance", GppGoodRoundedIcon],
  ["users", "Users & roles", GroupRoundedIcon],
  ["onboarding", "Azure DevOps", SettingsEthernetRoundedIcon],
];

function Navbar({ currentPage, setCurrentPage, user, onLogout }) {
  return (
    <Box component="aside" sx={{ width: { xs: "100%", lg: 272 }, flexShrink: 0, minHeight: { lg: "100vh" }, position: { lg: "fixed" }, inset: { lg: "0 auto 0 0" }, bgcolor: "#0d1830", color: "white", p: { xs: 2, lg: 2.5 }, zIndex: 10, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: { xs: 2, lg: 3.5 } }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}><AutoAwesomeRoundedIcon fontSize="small" /></Box>
        <Box><Typography fontWeight={700} fontSize={14.3} lineHeight={1.25}>Cloud-Agnostic Landing Zone for Secure AI Model Deployment</Typography><Typography variant="caption" sx={{ color: "#98a6c3" }}>Cloud orchestration</Typography></Box>
      </Box>
      <Typography variant="overline" sx={{ display: { xs: "none", lg: "block" }, color: "#7483a2", px: 1.5, mb: 1, letterSpacing: '.12em' }}>Workspace</Typography>
      <Box component="nav" sx={{ display: "flex", flexDirection: { xs: "row", lg: "column" }, gap: .75, overflowX: "auto" }}>
        {navItems.filter(([id]) => id !== "onboarding" || user?.role === "Administrator").map(([id, label, Icon]) => {
          const active = currentPage === id;
          return <Button key={id} onClick={() => setCurrentPage(id)} startIcon={<Icon />} sx={{ justifyContent: "flex-start", whiteSpace: "nowrap", px: 1.5, py: 1.15, color: active ? "white" : "#aab6cf", bgcolor: active ? "rgba(59,130,246,.22)" : "transparent", border: active ? "1px solid rgba(96,165,250,.25)" : "1px solid transparent", "&:hover": { bgcolor: "rgba(255,255,255,.07)", color: "white" } }}>{label}</Button>;
        })}
      </Box>
      <Box sx={{ mt: "auto", display: { xs: "none", lg: "block" } }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,.1)", my: 2.5 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#263653", fontWeight: 700 }}>{user?.username?.[0]?.toUpperCase() || "U"}</Box>
          <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" fontWeight={600} noWrap>{user?.username}</Typography><Chip label={user?.role} size="small" sx={{ mt: .4, height: 20, color: "#b8c4dc", bgcolor: "rgba(255,255,255,.07)", fontSize: 10 }} /></Box>
          <Button onClick={onLogout} aria-label="Log out" sx={{ minWidth: 36, color: "#98a6c3", p: .5 }}><LogoutRoundedIcon fontSize="small" /></Button>
        </Box>
      </Box>
    </Box>
  );
}
export default Navbar;
