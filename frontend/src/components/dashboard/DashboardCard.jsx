import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

function DashboardCard({ title, value }) {

  return (

    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(16,24,40,.04)"
      }}
    >

      <Box sx={{ width: 34, height: 4, bgcolor: "primary.main", borderRadius: 4, mb: 2 }} />
      <Typography
        variant="subtitle1"
        color="text.secondary"
      >
        {title}
      </Typography>

      <Typography
        variant="h4"
        sx={{
          mt: 1,
          fontWeight: 700,
          letterSpacing: "-.04em"
        }}
      >
        {value}
      </Typography>

    </Paper>

  );

}

export default DashboardCard;
