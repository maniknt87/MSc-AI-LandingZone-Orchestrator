import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

function SummaryCard({ icon, title, value }) {

  return (

    <Card
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2
      }}
    >

      <CardContent>

        <Typography
          variant="subtitle2"
          color="text.secondary"
        >
          {icon} {title}
        </Typography>

        <Typography
          variant="h6"
          sx={{ mt: 1 }}
        >
          {value || "Not Selected"}
        </Typography>

      </CardContent>

    </Card>

  );

}

export default SummaryCard;