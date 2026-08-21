import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { cloudProviders } from "../../constants/cloudProviders";

function CloudStep({ deploymentRequest, setDeploymentRequest }) {

  const handleSelectCloud = (cloud) => {

    setDeploymentRequest({
      ...deploymentRequest,
      cloud: cloud,
      vmSize: "",
    });

  };

  return (

    <Grid container spacing={3} sx={{ mt: 2 }}>

      {cloudProviders.map((provider) => (

        <Grid item xs={12} md={6} key={provider.id}>

          <Card
            onClick={() => handleSelectCloud(provider.shortName)}

            sx={{
              cursor: "pointer",

              border:
                deploymentRequest.cloud === provider.shortName
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
                {provider.icon}
              </Typography>

              <Typography
                variant="h6"
                align="center"
              >
                {provider.name}
              </Typography>

              <Typography
                variant="body2"
                align="center"
              >
                {provider.description}
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      ))}

    </Grid>

  );

}

export default CloudStep;
