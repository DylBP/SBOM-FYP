# ─── S3 Bucket Output ───────────────────────────────
output "sbom_bucket_name" {
  description = "The name of the generated S3 bucket for SBOM files"
  value       = aws_s3_bucket.sbom_bucket.bucket
}

# ─── DynamoDB Table Outputs ─────────────────────────
output "projects_table_name" {
  description = "The name of the DynamoDB table for projects"
  value       = aws_dynamodb_table.projects_table.name
}

output "sbom_table_name" {
  description = "The name of the DynamoDB table for SBOMs"
  value       = aws_dynamodb_table.sbom_table.name
}

# ─── Cognito User Pool / Client Output ───────────────────────
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.sbom_user_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.sbom_app_client.id
}

output "cognito_client_secret" {
  value     = aws_cognito_user_pool_client.sbom_app_client.client_secret
  sensitive = true
}

output "load_balancer_url" {
  value = aws_lb.api_alb.dns_name
}

output "sbom_api_instance_public_ips" {
  description = "Public IP addresses of SBOM API EC2 instances"
  value       = data.aws_instances.sbom_api.public_ips
}