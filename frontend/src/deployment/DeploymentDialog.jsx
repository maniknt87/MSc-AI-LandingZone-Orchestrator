import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Stack,
} from "@mui/material";

function DeploymentDialog({

  open,

  deployment,

  onClose,

}) {

  if (!deployment) {

    return null;

  }

  return (

    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >

      <DialogTitle>

        Deployment Details

      </DialogTitle>

      <DialogContent>

        <Stack spacing={2} sx={{ mt: 1 }}>

          <Typography>

            <b>Deployment ID:</b> {deployment.deployment_id}

          </Typography>

          <Divider />

          <Typography>

            <b>Cloud:</b> {deployment.cloud}

          </Typography>

          <Typography>

            <b>Environment:</b> {deployment.environment}

          </Typography>

          <Typography>

            <b>Region:</b> {deployment.region}

          </Typography>

          <Typography>

            <b>Workload:</b> {deployment.workload}

          </Typography>

          <Typography>

            <b>Status:</b> {deployment.status}

          </Typography>

          <Typography>

            <b>Created Time:</b> {deployment.created_time}

          </Typography>

        </Stack>

      </DialogContent>

      <DialogActions>

        <Button
          variant="contained"
          onClick={onClose}
        >

          Close

        </Button>

      </DialogActions>

    </Dialog>

  );

}

export default DeploymentDialog;