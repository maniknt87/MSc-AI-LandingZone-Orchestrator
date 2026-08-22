terraform {
  # Values are supplied by aws-pipelines.yml so state configuration remains
  # environment-specific and no account details are committed to source.
  backend "s3" {}
}
