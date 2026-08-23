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

// ------------------------------------
// Application Users & Role Metadata
// ------------------------------------

export const getUsers = async () => (await API.get("/users")).data;
export const createUser = async (user) => (await API.post("/users", user)).data;
export const updateUser = async (username, user) => (await API.patch(`/users/${username}`, user)).data;
export const getUserRoles = async (username) => (await API.get(`/users/${username}/roles`)).data;
export const assignUserCloudRole = async (role) => (await API.post("/users/roles", role)).data;
export const removeUserCloudRole = async (role) => (await API.delete("/users/roles", { data: role })).data;

// ------------------------------------
// Model Playground
// ------------------------------------

export const getPlaygroundDeployments = async () => {
  const response = await API.get("/playground/deployments");
  return response.data;
};

export const getPlaygroundHistory = async () => {
  const response = await API.get("/playground/history");
  return response.data;
};

export const invokePlaygroundModel = async (request) => {
  const response = await API.post("/playground/invoke", request);
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
