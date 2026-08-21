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

export const getAzureDevOpsConnection = async () => {
  const response = await API.get("/onboarding/azure-devops");
  return response.data;
};

export const saveAzureDevOpsConnection = async (connection) => {
  const response = await API.put("/onboarding/azure-devops", connection);
  return response.data;
};

export const getPlaygroundDeployments = async () => {
  const response = await API.get("/playground/deployments");
  return response.data;
};

export const invokePlaygroundModel = async (request) => {
  const response = await API.post("/playground/invoke", request);
  return response.data;
};

export const getPlaygroundHistory = async (limit = 20) => {
  const response = await API.get("/playground/history", { params: { limit } });
  return response.data;
};

export default API;
