output "sagemaker_execution_role_arn" {
  description = "Execution role used by governed SageMaker inference models"
  value       = aws_iam_role.sagemaker_execution.arn
}
