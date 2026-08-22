import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Stack,
  Link,
} from "@mui/material";

function DeploymentDialog({

  open,

  deployment,

  onClose,

  onDestroy,

  destroying = false,

  onRetry,

  retrying = false,

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

          <Typography><b>Action:</b> {deployment.action || "apply"}</Typography>

          {deployment.retry_of && <Typography><b>Retry of:</b> {deployment.retry_of}</Typography>}

          {deployment.destroy_of && <Typography><b>Destroy of:</b> {deployment.destroy_of}</Typography>}

          <Typography><b>Pipeline:</b> {deployment.pipeline_name}</Typography>

          <Typography>
            <b>Run:</b>{" "}
            {deployment.pipeline_url ? (
              <Link href={deployment.pipeline_url} target="_blank" rel="noopener noreferrer">
                #{deployment.pipeline_run_id || deployment.pipeline_id}
              </Link>
            ) : (
              `#${deployment.pipeline_run_id || deployment.pipeline_id}`
            )}
          </Typography>

          {deployment.result && (
            <Typography><b>Result:</b> {deployment.result}</Typography>
          )}

          {deployment.finished_time && (
            <Typography><b>Finished:</b> {deployment.finished_time}</Typography>
          )}

          <Typography>

            <b>Created Time:</b> {deployment.created_time}

          </Typography>

        </Stack>

      </DialogContent>

      <DialogActions>

        {deployment.can_retry && (
          <Button
            color="warning"
            variant="outlined"
            disabled={retrying || destroying}
            onClick={() => onRetry(deployment)}
          >
            {retrying ? "Queuing retry…" : "Retry deployment"}
          </Button>
        )}

        {deployment.can_destroy && (
          <Button
            color="error"
            variant="outlined"
            disabled={destroying || retrying}
            onClick={() => onDestroy(deployment)}
          >
            {destroying ? "Queuing destroy…" : "Destroy resources"}
          </Button>
        )}

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
