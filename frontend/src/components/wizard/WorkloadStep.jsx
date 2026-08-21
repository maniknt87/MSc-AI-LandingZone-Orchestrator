import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { aiWorkloads } from "../../constants/aiWorkloads";

function WorkloadStep({ deploymentRequest, setDeploymentRequest }) {
  const handleSelectWorkload = (workload) => {
    setDeploymentRequest({
      ...deploymentRequest,
      workload: workload.id,
      modelId: "",
      modelName: "",
    });
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Select AI Workload
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the AI workload you want to deploy through the AI-ready
        landing zone.
      </Typography>

      <Grid container spacing={3}>
        {aiWorkloads.map((workload) => (
          <Grid item xs={12} md={6} lg={4} key={workload.id}>
            <Card
              onClick={() => handleSelectWorkload(workload)}
              sx={{
                cursor: "pointer",
                height: "100%",
                border:
                  deploymentRequest.workload === workload.id
                    ? "3px solid #1976d2"
                    : "1px solid #ddd",
                transition: "0.3s",
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Typography variant="h6">
                  {workload.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {workload.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default WorkloadStep;
