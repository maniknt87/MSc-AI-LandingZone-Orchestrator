import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

function InfrastructureStep({
  deploymentRequest,
  setDeploymentRequest,
}) {
  return (
    <Paper sx={{ p: 4 }}>

      <Typography
        variant="h4"
        align="center"
        gutterBottom
      >
        Infrastructure Configuration
      </Typography>

      <Typography
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Configure the infrastructure settings for this deployment.
      </Typography>

      {/* VM Size & Storage */}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 4,
          flexWrap: "wrap",
        }}
      >

        <FormControl sx={{ minWidth: 250 }}>

          <InputLabel>VM Size</InputLabel>

          <Select
            value={deploymentRequest.vmSize}
            label="VM Size"
            onChange={(e) =>
              setDeploymentRequest({
                ...deploymentRequest,
                vmSize: e.target.value,
              })
            }
          >
            <MenuItem value="Standard_B2s">
              Standard_B2s
            </MenuItem>

            <MenuItem value="Standard_D2s_v5">
              Standard_D2s_v5
            </MenuItem>

            <MenuItem value="Standard_D4s_v5">
              Standard_D4s_v5
            </MenuItem>

          </Select>

        </FormControl>

        <FormControl sx={{ minWidth: 250 }}>

          <InputLabel>Storage Type</InputLabel>

          <Select
            value={deploymentRequest.storageType}
            label="Storage Type"
            onChange={(e) =>
              setDeploymentRequest({
                ...deploymentRequest,
                storageType: e.target.value,
              })
            }
          >

            <MenuItem value="Standard SSD">
              Standard SSD
            </MenuItem>

            <MenuItem value="Premium SSD">
              Premium SSD
            </MenuItem>

          </Select>

        </FormControl>

      </Box>

      {/* Infrastructure Options */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >

        <FormControlLabel
          control={
            <Checkbox
              checked={deploymentRequest.enableBackup}
              onChange={(e) =>
                setDeploymentRequest({
                  ...deploymentRequest,
                  enableBackup: e.target.checked,
                })
              }
            />
          }
          label="Enable Backup"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={deploymentRequest.enableMonitoring}
              onChange={(e) =>
                setDeploymentRequest({
                  ...deploymentRequest,
                  enableMonitoring: e.target.checked,
                })
              }
            />
          }
          label="Enable Azure Monitor"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={deploymentRequest.enableAvailabilityZone}
              onChange={(e) =>
                setDeploymentRequest({
                  ...deploymentRequest,
                  enableAvailabilityZone: e.target.checked,
                })
              }
            />
          }
          label="Enable Availability Zone"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={deploymentRequest.enablePrivateEndpoint}
              onChange={(e) =>
                setDeploymentRequest({
                  ...deploymentRequest,
                  enablePrivateEndpoint: e.target.checked,
                })
              }
            />
          }
          label="Enable Private Endpoint"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={deploymentRequest.enablePublicIP}
              onChange={(e) =>
                setDeploymentRequest({
                  ...deploymentRequest,
                  enablePublicIP: e.target.checked,
                })
              }
            />
          }
          label="Enable Public IP"
        />

      </Box>

    </Paper>
  );
}

export default InfrastructureStep;