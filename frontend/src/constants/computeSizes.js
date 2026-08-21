export const computeSizes = {
  Azure: [
    { value: "Standard_DS3_v2", label: "Standard_DS3_v2", detail: "CPU · Development and lightweight inference" },
    { value: "Standard_NC4as_T4_v3", label: "Standard_NC4as_T4_v3", detail: "1× NVIDIA T4 · Cost-efficient GPU inference" },
    { value: "Standard_NC8as_T4_v3", label: "Standard_NC8as_T4_v3", detail: "1× NVIDIA T4 · Higher CPU and memory" },
    { value: "Standard_NC16as_T4_v3", label: "Standard_NC16as_T4_v3", detail: "1× NVIDIA T4 · Production inference" },
  ],
  AWS: [
    { value: "ml.m5.xlarge", label: "ml.m5.xlarge", detail: "CPU · Development and lightweight inference" },
    { value: "ml.c6i.xlarge", label: "ml.c6i.xlarge", detail: "Compute optimized · CPU inference" },
    { value: "ml.g5.xlarge", label: "ml.g5.xlarge", detail: "1× NVIDIA A10G · GPU inference" },
    { value: "ml.g6.xlarge", label: "ml.g6.xlarge", detail: "1× NVIDIA L4 · Modern GPU inference" },
  ],
};

export const approvedComputeSizes = {
  Azure: {
    Development: ["Standard_DS3_v2", "Standard_NC4as_T4_v3"],
    Testing: ["Standard_DS3_v2", "Standard_NC4as_T4_v3", "Standard_NC8as_T4_v3"],
    Production: ["Standard_DS3_v2", "Standard_NC4as_T4_v3", "Standard_NC8as_T4_v3", "Standard_NC16as_T4_v3"],
  },
  AWS: {
    Development: ["ml.m5.xlarge", "ml.c6i.xlarge"],
    Testing: ["ml.m5.xlarge", "ml.c6i.xlarge", "ml.g5.xlarge"],
    Production: ["ml.m5.xlarge", "ml.c6i.xlarge", "ml.g5.xlarge", "ml.g6.xlarge"],
  },
};
