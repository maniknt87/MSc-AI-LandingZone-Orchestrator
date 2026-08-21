import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>

        <Typography
          variant="h6"
          sx={{ flexGrow: 1 }}
        >
          ☁ Cloud Landing Zone Self-Service Portal
        </Typography>

        <Button color="inherit">Dashboard</Button>

        <Button color="inherit">Deploy</Button>

        <Button color="inherit">Status</Button>

        <Button color="inherit">History</Button>

        <Button color="inherit">Project Info</Button>

      </Toolbar>
    </AppBar>
  );
}

export default Header;