import { useEffect } from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";


import { environments } from "../../constants/environments";


// ----------------------------------------------------
// Available Regions
// ----------------------------------------------------
// These are the regions that can be selected in the UI.
// Governance decides which of these are actually approved.
// ----------------------------------------------------

const availableRegions = {

  Azure: [

    "Central India",
    "East US",
    "West Europe",

    // Intentionally not approved by governance.
    // Used to demonstrate backend policy enforcement.
    "South India",
    "East Asia",
    "Southeast Asia",

  ],

  AWS: [

    "South India",
    "US East (N. Virginia)",
    "Europe (Ireland)",

    // Intentionally not approved by governance.
    // Used to demonstrate backend policy enforcement.
    "Hyderabad",
    "Asia Pacific (Hong Kong)",
    "Asia Pacific (Singapore)",

  ],

};


// ----------------------------------------------------
// Approved Regions
// ----------------------------------------------------
// MUST match backend governance policy.
// ----------------------------------------------------

const approvedRegions = {

  Azure: [

    "Central India",
    "East US",
    "West Europe",

  ],

  AWS: [

    "South India",
    "US East (N. Virginia)",
    "Europe (Ireland)",

  ],

};


// ----------------------------------------------------
// Environment Step
// ----------------------------------------------------

function EnvironmentStep({
  deploymentRequest,
  setDeploymentRequest,
}) {


  // --------------------------------------------------
  // Environment Selection
  // --------------------------------------------------

  const handleSelectEnvironment = (environment) => {

    setDeploymentRequest({
      ...deploymentRequest,
      environment,
    });

  };


  // --------------------------------------------------
  // Region Selection
  // --------------------------------------------------

  const handleSelectRegion = (region) => {

    setDeploymentRequest({
      ...deploymentRequest,
      region,
    });

  };


  // --------------------------------------------------
  // Regions for selected cloud
  // --------------------------------------------------

  const regions =
    availableRegions[deploymentRequest.cloud] || [];


  // --------------------------------------------------
  // Reset region when cloud changes
  // --------------------------------------------------

  useEffect(() => {

    if (
      deploymentRequest.region &&
      !regions.includes(deploymentRequest.region)
    ) {

      setDeploymentRequest((previous) => ({
        ...previous,
        region: "",
      }));

    }

  }, [
    deploymentRequest.cloud,
    deploymentRequest.region,
    regions,
    setDeploymentRequest,
  ]);


  // --------------------------------------------------
  // Check whether region is governance approved
  // --------------------------------------------------

  const isApprovedRegion = (region) => {

    return (
      approvedRegions[
        deploymentRequest.cloud
      ] || []
    ).includes(region);

  };


  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (

    <Box sx={{ mt: 2 }}>


      {/* ============================================== */}
      {/* Environment */}
      {/* ============================================== */}

      <Typography
        variant="h6"
        gutterBottom
      >
        Select Environment
      </Typography>


      <Grid
        container
        spacing={3}
        sx={{ mb: 5 }}
      >

        {environments.map((environment) => (

          <Grid
            item
            xs={12}
            md={4}
            key={environment.id}
          >

            <Card

              onClick={() =>
                handleSelectEnvironment(
                  environment.title
                )
              }

              sx={{
                cursor: "pointer",

                border:
                  deploymentRequest.environment ===
                  environment.title
                    ? "3px solid #1976d2"
                    : "1px solid #cccccc",

                transition: "0.3s",

                height: "100%",

                "&:hover": {
                  boxShadow: 6,
                },
              }}

            >

              <CardContent>

                <Typography
                  variant="h3"
                  align="center"
                >
                  {environment.icon}
                </Typography>


                <Typography
                  variant="h6"
                  align="center"
                >
                  {environment.title}
                </Typography>


                <Typography
                  variant="body2"
                  align="center"
                  color="text.secondary"
                >
                  {environment.description}
                </Typography>

              </CardContent>

            </Card>

          </Grid>

        ))}

      </Grid>


      {/* ============================================== */}
      {/* Deployment Region */}
      {/* ============================================== */}

      <Typography
        variant="h6"
        gutterBottom
      >
        Deployment Region
      </Typography>


      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Select a deployment region. The selected region
        will be validated against the platform governance
        policy before deployment.
      </Typography>


      {!deploymentRequest.cloud && (

        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          Select a cloud provider first to view available
          deployment regions.
        </Alert>

      )}


      {deploymentRequest.cloud &&
        regions.length > 0 && (

          <FormControl
            fullWidth
            sx={{ maxWidth: 600 }}
          >

            <InputLabel id="deployment-region-label">
              Deployment Region
            </InputLabel>


            <Select

              labelId="deployment-region-label"

              value={
                deploymentRequest.region || ""
              }

              label="Deployment Region"

              onChange={(event) =>
                handleSelectRegion(
                  event.target.value
                )
              }

            >

              {regions.map((region) => {

                const approved =
                  isApprovedRegion(region);


                return (

                  <MenuItem
                    key={region}
                    value={region}
                  >

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        width: "100%",
                        gap: 3,
                      }}
                    >

                      <span>
                        {region}
                      </span>

                      <Typography
                        variant="caption"
                        color={
                          approved
                            ? "success.main"
                            : "warning.main"
                        }
                      >
                        {approved
                          ? "✓ Approved"
                          : "⚠ Not approved"}
                      </Typography>

                    </Box>

                  </MenuItem>

                );

              })}

            </Select>

          </FormControl>

        )}


      {/* ============================================== */}
      {/* Governance Information */}
      {/* ============================================== */}

      {deploymentRequest.cloud &&
        regions.length > 0 && (

          <Box sx={{ mt: 2 }}>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
              }}
            >

              Governance-approved regions for{" "}

              <strong>
                {deploymentRequest.cloud}
              </strong>

              :{" "}

              {(
                approvedRegions[
                  deploymentRequest.cloud
                ] || []
              ).join(" • ")}

            </Typography>


            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.5,
              }}
            >

              Region compliance is evaluated by the
              backend governance engine before deployment.

            </Typography>

          </Box>

        )}


      {/* ============================================== */}
      {/* Warning for non-approved region */}
      {/* ============================================== */}

      {deploymentRequest.region &&
        !isApprovedRegion(
          deploymentRequest.region
        ) && (

          <Alert
            severity="warning"
            sx={{ mt: 2 }}
          >

            <strong>
              Governance warning:
            </strong>{" "}

            {deploymentRequest.region} is not currently
            approved for {deploymentRequest.cloud}.
            The deployment will be blocked if this
            region fails the governance policy.

          </Alert>

        )}

    </Box>

  );

}


export default EnvironmentStep;