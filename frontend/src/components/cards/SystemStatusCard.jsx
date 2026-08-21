import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

import { systemStatus } from "../../constants/systemStatus";

function SystemStatusCard() {

  return (

    <Card sx={{ mt: 4 }}>

      <CardContent>

        <Typography variant="h5" gutterBottom>
          System Status
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {systemStatus.map((item) => (

          <Box
            key={item.service}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2
            }}
          >

            <Typography>
              {item.service}
            </Typography>

            <Chip
              label={item.status}
              color="success"
            />

          </Box>

        ))}

      </CardContent>

    </Card>

  );

}

export default SystemStatusCard;