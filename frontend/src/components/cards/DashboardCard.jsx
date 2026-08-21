
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

function DashboardCard({ title, description, icon }) {
  return (
    <Card
      sx={{
        width: 280,
        height: 180,
        cursor: "pointer",
      }}
    >
      <CardContent>

        <Typography variant="h3">
          {icon}
        </Typography>

        <Typography
          variant="h6"
          gutterBottom
        >
          {title}
        </Typography>

        <Typography variant="body2">
          {description}
        </Typography>

      </CardContent>
    </Card>
  );
}

export default DashboardCard;