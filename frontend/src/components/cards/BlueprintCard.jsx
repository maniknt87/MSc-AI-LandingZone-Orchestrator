import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { azureAIPlan } from "../../constants/deploymentPlans";

function BlueprintCard() {
  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>

        <Typography variant="h5" gutterBottom>
          Landing Zone Blueprint
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1">
          Cloud: {azureAIPlan.cloud}
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          Deployment: {azureAIPlan.deployment}
        </Typography>

        <List>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Management Group</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Subscription</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Resource Group</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Virtual Network</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Private Endpoint</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Azure AI Foundry</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Azure Container Registry</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Azure Kubernetes Service</ListItem>
          <ListItem><CheckCircleIcon sx={{ mr: 1 }} />Log Analytics</ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography>
          Estimated Deployment Time: <strong>7 Minutes</strong>
        </Typography>

        <Typography>
          Estimated Monthly Cost: <strong>₹2,500</strong>
        </Typography>

      </CardContent>
    </Card>
  );
}

export default BlueprintCard;