import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { regions } from "../../constants/regions";

function RegionStep({ deploymentRequest, setDeploymentRequest }) {

  const handleSelectRegion = (region) => {

    setDeploymentRequest({
      ...deploymentRequest,
      region: region
    });

  };

  return (

    <Grid container spacing={3} sx={{ mt: 2 }}>

      {regions.map((region) => (

        <Grid item xs={12} md={6} key={region.id}>

          <Card

            onClick={() => handleSelectRegion(region.title)}

            sx={{
              cursor: "pointer",

              border:
                deploymentRequest.region === region.title
                  ? "3px solid #1976d2"
                  : "1px solid #cccccc",

              transition: "0.3s",

              "&:hover": {
                boxShadow: 6
              }

            }}

          >

            <CardContent>

              <Typography
                variant="h3"
                align="center"
              >
                {region.icon}
              </Typography>

              <Typography
                variant="h6"
                align="center"
              >
                {region.title}
              </Typography>

              <Typography
                variant="body2"
                align="center"
              >
                {region.description}
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      ))}

    </Grid>

  );

}

export default RegionStep;