# ─── RANDOM UUID ─────────────────────────────────────
resource "random_uuid" "bucket_suffix" {}

# ─── S3 BUCKET ──────────────────────────────────────
resource "aws_s3_bucket" "sbom_bucket" {
  bucket        = "sbom-bucket-${random_uuid.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name        = "SBOM Bucket"
    Environment = "dev"
  }
}

resource "aws_s3_bucket_versioning" "sbom_bucket_versioning" {
  bucket = aws_s3_bucket.sbom_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ─── PROJECTS DYNAMODB TABLE ────────────────────────
resource "aws_dynamodb_table" "projects_table" {
  name         = var.projects_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "projectId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "projectId"
    type = "S"
  }

  global_secondary_index {
    name            = "projectId-userId-index"
    hash_key        = "projectId"
    range_key       = "userId"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Projects Table"
    Environment = "dev"
  }
}

# ─── SBOM DYNAMODB TABLE ────────────────────────────
resource "aws_dynamodb_table" "sbom_table" {
  name         = var.sbom_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "projectId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "projectId-index"
    hash_key        = "projectId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = {
    Name        = "SBOM Table"
    Environment = "dev"
  }
}

# ─── COGNITO USER POOL ──────────────────────────────
resource "aws_cognito_user_pool" "sbom_user_pool" {
  name = "sbom-user-pool"

  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }
}

resource "aws_cognito_user_pool_client" "sbom_app_client" {
  name         = "sbom-app-client"
  user_pool_id = aws_cognito_user_pool.sbom_user_pool.id
  generate_secret = true

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]
}

# ─── EC2 LAUNCH TEMPLATE AND INSTANCE ───────────────
data "template_file" "user_data" {
  template = file("${path.module}/user_data.sh")

  vars = {
    bucket_name           = aws_s3_bucket.sbom_bucket.bucket
    sbom_table_name       = aws_dynamodb_table.sbom_table.name
    project_table_name    = aws_dynamodb_table.projects_table.name
    cognito_user_pool_id  = aws_cognito_user_pool.sbom_user_pool.id
    cognito_client_id     = aws_cognito_user_pool_client.sbom_app_client.id
    cognito_client_secret = aws_cognito_user_pool_client.sbom_app_client.client_secret
  }
}

resource "aws_launch_template" "sbom_lt" {
  name_prefix   = "sbom-fyp-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  user_data = base64encode(data.template_file.user_data.rendered)

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "SBOM-FYP"
    }
  }
}

resource "aws_instance" "sbom_instance" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  vpc_security_group_ids = ["sg-01a6e3d267db51aae"]
  associate_public_ip_address = true
  iam_instance_profile = "delve-processing-server"

  launch_template {
    id      = aws_launch_template.sbom_lt.id
    version = "$Latest"
  }

  tags = {
    Name = "SBOM-FYP"
  }
}
