import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

import CloudStep from "../components/wizard/CloudStep";
import WorkloadStep from "../components/wizard/WorkloadStep";
import ModelStep from "../components/wizard/ModelStep";
import EnvironmentStep from "../components/wizard/EnvironmentStep";
import LandingZoneStep from "../components/wizard/LandingZoneStep";
import ReviewStep from "../components/wizard/ReviewStep";

import { deployLandingZone, getGovernanceSettings } from "../services/api";

import SecurityGovernanceStep from "../components/wizard/SecurityGovernanceStep";

const steps = [
  "Cloud",
  "AI Workload",
  "Model",
  "Environment",
  "Landing Zone",
  "Security & Governance",
  "Review",
];

function DeploymentPlanner() {
  const [computePolicy, setComputePolicy] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    severity: "success",
  });

  const [deploymentRequest, setDeploymentRequest] = useState({
    deploymentName: "customer-ai-platform",
    hubAddressSpace: "10.0.0.0/16",
    generalSpokeAddressSpace: "10.1.0.0/16",
    aiSpokeAddressSpace: "10.2.0.0/16",
    cloud: "",
    workload: "",
    modelId: "",
    modelName: "",
    environment: "",
    region: "",
      enableIdentityGovernance: true,
      enableModelGovernance: true,
    vmSize: "",
    storageType: "",
    enableBackup: true,
    enableMonitoring: true,
    enableAvailabilityZone: true,
    enablePrivateEndpoint: true,
    enablePublicIP: false,
  });

  useEffect(() => {
    let active = true;
    getGovernanceSettings().then((settings) => {
      if (active) setComputePolicy(settings.compute_sizes || null);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const canContinue = [
    Boolean(deploymentRequest.cloud),
    Boolean(deploymentRequest.workload),
    Boolean(deploymentRequest.modelId && deploymentRequest.modelName),
    Boolean(deploymentRequest.environment && deploymentRequest.region),
    Boolean(deploymentRequest.deploymentName && deploymentRequest.hubAddressSpace && deploymentRequest.generalSpokeAddressSpace && deploymentRequest.aiSpokeAddressSpace && deploymentRequest.vmSize),
    true,
    true,
  ][activeStep];

  const handleProvision = async () => {
    try {
      setLoading(true);

      const response = await deployLandingZone(deploymentRequest);

      console.log("Backend Response:", response);

      setDialog({
        open: true,
        title: "Deployment Submitted",
        message: response.message,
        severity: "success",
      });
    } catch (error) {
      console.error(error);

      if (error.response) {
        const report = error.response.data.detail;

        // If backend returned a compliance report
        if (report?.results && Array.isArray(report.results)) {
          let message = "";

          message += "❌ GOVERNANCE COMPLIANCE REPORT\n\n";

          message += `Compliance Score : ${report.compliance_score}%\n`;
          message += `Passed Policies : ${report.passed}\n`;
          message += `Failed Policies : ${report.failed}\n\n`;

          report.results.forEach((policy) => {
            if (policy.status === "PASS") {
              message += `✅ ${policy.policy}\n`;
            } else {
              message += `❌ ${policy.policy}\n`;
              message += `   ${policy.reason}\n`;
            }
          });

          setDialog({
            open: true,
            title: "Governance Compliance Report",
            message,
            severity:
              report.compliance_score >= 80 ? "success" : "error",
          });
        } else {
          const message = Array.isArray(report)
            ? report.map((item) => item.msg).join("\n")
            : typeof report === "object"
              ? JSON.stringify(report, null, 2)
              : report;
          setDialog({
            open: true,
            title: "Deployment Failed",
            message,
            severity: "error",
          });
        }
      } else {
        setDialog({
          open: true,
          title: "Connection Error",
          message: "Unable to contact backend.",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={dialog.open}
        onClose={() =>
          setDialog((prev) => ({
            ...prev,
            open: false,
          }))
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 8,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          {dialog.title}
        </DialogTitle>

        <DialogContent>
          <Alert
            severity={dialog.severity}
            sx={{
              alignItems: "flex-start",
              whiteSpace: "pre-line",
            }}
          >
            {dialog.message}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            variant="contained"
            onClick={() =>
              setDialog((prev) => ({
                ...prev,
                open: false,
              }))
            }
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Box>
        <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
          <Box><Chip label="Guided deployment" size="small" color="primary" variant="outlined" sx={{ mb: 1.25 }} /><Typography variant="h4">Create AI landing zone</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Configure, validate and submit a governed cloud environment.</Typography></Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "success.dark", bgcolor: "#ecfdf3", border: "1px solid #d1fadf", px: 1.5, py: .8, borderRadius: 2 }}><Box sx={{ width: 7, height: 7, bgcolor: "#12b76a", borderRadius: "50%" }} /><Typography variant="caption" fontWeight={600}>Platform ready</Typography></Box>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, lg: 4 }, border: "1px solid", borderColor: "divider", boxShadow: "0 8px 28px rgba(16,24,40,.05)" }}>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{ mb: 5, overflowX: "auto", pb: 1, "& .MuiStepLabel-label": { fontSize: 12, mt: .75 }, "& .MuiStepIcon-root.Mui-completed": { color: "#12b76a" } }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* STEP 1 - CLOUD */}

          {activeStep === 0 && (
            <CloudStep
              deploymentRequest={deploymentRequest}
              setDeploymentRequest={setDeploymentRequest}
            />
          )}

          {/* STEP 2 - AI WORKLOAD */}

          {activeStep === 1 && (
            <WorkloadStep
              deploymentRequest={deploymentRequest}
              setDeploymentRequest={setDeploymentRequest}
            />
          )}

          {/* STEP 3 - MODEL */}

          {activeStep === 2 && (
            <ModelStep
              deploymentRequest={deploymentRequest}
              setDeploymentRequest={setDeploymentRequest}
            />
          )}

          {/* STEP 4 - ENVIRONMENT */}

          {activeStep === 3 && (
            <EnvironmentStep
              deploymentRequest={deploymentRequest}
              setDeploymentRequest={setDeploymentRequest}
            />
          )}

          {/* STEP 5 - INFRASTRUCTURE */}

         {activeStep === 4 && (
          <LandingZoneStep
          deploymentRequest={deploymentRequest}
          setDeploymentRequest={setDeploymentRequest}
          computePolicy={computePolicy}
          />
            )}

         {activeStep === 5 && (
          <SecurityGovernanceStep
          deploymentRequest={deploymentRequest}
          setDeploymentRequest={setDeploymentRequest}
          />
            )}

          {/* STEP 6 - REVIEW */}

          {activeStep === 6 && (
          <ReviewStep
          deploymentRequest={deploymentRequest}
          />
            )}

          {/* NAVIGATION */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 5,
            }}
          >
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={<RocketLaunchRoundedIcon />}
                onClick={handleProvision}
                disabled={loading}
              >
                {loading
                  ? "Provisioning..."
                  : "Provision Landing Zone"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ px: 3 }}
                disabled={!canContinue}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}

export default DeploymentPlanner;
