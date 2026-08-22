import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ------------------------------------
// Deployment API
// ------------------------------------

export const deployLandingZone = async (deploymentRequest) => {
  const response = await API.post("/deploy", deploymentRequest);
  return response.data;
};

// ------------------------------------
// Deployment History
// ------------------------------------

export const getDeployments = async () => {
  const response = await API.get("/deployments");
  return response.data;
};

// ------------------------------------
// Governance Settings
// ------------------------------------

export const getGovernanceSettings = async () => {
  const response = await API.get("/governance/settings");
  return response.data;
};

export const destroyDeployment = async (deploymentId) => {
  const response = await API.post(`/deployments/${deploymentId}/destroy`);
  return response.data;
};

export const retryDeployment = async (deploymentId) => {
  const response = await API.post(`/deployments/${deploymentId}/retry`);
  return response.data;
};

export const getAzureDevOpsConnection = async () => {
  const response = await API.get("/onboarding/azure-devops");
  return response.data;
};

export const saveAzureDevOpsConnection = async (connection) => {
  const response = await API.put("/onboarding/azure-devops", connection);
  return response.data;
};

export default API;
