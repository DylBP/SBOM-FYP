# ─── Random Suffix ──────────────────────────────────────
resource "random_uuid" "bucket_suffix" {}

# ─── S3 Bucket ──────────────────────────────────────
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

# ─── Projects DynamoDB Table ────────────────────────
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

  tags = {
    Name        = "Projects Table"
    Environment = "dev"
  }
}

# ─── SBOM DynamoDB Table ────────────────────────────
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

# ─── Cognito User Authentication ──────────────────────────────
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

# ─── EC2 Launch Template (Application Server) ───────────────
resource "aws_launch_template" "sbom_lt" {
  name_prefix   = "sbom-fyp-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    bucket_name           = aws_s3_bucket.sbom_bucket.bucket
    sbom_table_name       = aws_dynamodb_table.sbom_table.name
    project_table_name    = aws_dynamodb_table.projects_table.name
    cognito_user_pool_id  = aws_cognito_user_pool.sbom_user_pool.id
    cognito_client_id     = aws_cognito_user_pool_client.sbom_app_client.id
    cognito_client_secret = aws_cognito_user_pool_client.sbom_app_client.client_secret
  }))

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.instance_sg.id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "SBOM-FYP"
    }
  }
}

# ─── Security Groups (Load Balancer) ─────────────────────────────────
resource "aws_security_group" "alb_sg" {
  name        = "sbom-alb-sg"
  description = "Allow HTTP traffic to ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─── Security Groups (Instances) ──────────────────────────────
resource "aws_security_group" "instance_sg" {
  name        = "sbom-instance-sg"
  description = "Allow traffic from ALB to EC2"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─── Load Balancer, Target Group, Listener ──────────────────────────────
resource "aws_lb" "api_alb" {
  name               = "sbom-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.public_subnets
}

resource "aws_lb_target_group" "api_tg" {
  name        = "sbom-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 10
    healthy_threshold   = 3
    unhealthy_threshold = 5
    matcher             = "200"
  }
}

resource "aws_lb_listener" "api_listener" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# ─── Auto-Scaling Group ──────────────────────────────
resource "aws_autoscaling_group" "api_asg" {
  desired_capacity     = 1
  max_size             = 3
  min_size             = 1
  vpc_zone_identifier  = var.public_subnets
  target_group_arns    = [aws_lb_target_group.api_tg.arn]

  launch_template {
    id      = aws_launch_template.sbom_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "SBOM-API"
    propagate_at_launch = true
  }

  health_check_type         = "ELB"
  health_check_grace_period = 60
  force_delete               = true
}

# ─── EC2 IAM Role and Limited Policies ──────────────────────────────
resource "aws_iam_role" "ec2_role" {
  name = "sbom-api-ec2-role"

  lifecycle {
    create_before_destroy = true
  }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "s3_limited_access" {
  name        = "SBOM-S3-Access-Policy"
  description = "Allow EC2 limited access to SBOM S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Resource = [
          "arn:aws:s3:::${aws_s3_bucket.sbom_bucket.bucket}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "dynamo_limited_access" {
  name        = "SBOM-Dynamo-Access-Policy"
  description = "Allow EC2 limited access to SBOM and Projects tables"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ],
        Resource = [
          "${aws_dynamodb_table.sbom_table.arn}",
          "${aws_dynamodb_table.projects_table.arn}",
          "${aws_dynamodb_table.sbom_table.arn}/index/*",
          "${aws_dynamodb_table.projects_table.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "cognito_limited_access" {
  name        = "SBOM-Cognito-Access-Policy"
  description = "Allow only needed Cognito actions"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "cognito-idp:SignUp",
          "cognito-idp:ConfirmSignUp",
          "cognito-idp:InitiateAuth",
          "cognito-idp:RevokeToken"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "dynamo_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.dynamo_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "cognito_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cognito_limited_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "sbom-api-instance-profile"

  lifecycle {
    create_before_destroy = true
  }

  role = aws_iam_role.ec2_role.name
}

# ─── Auto-Scaling Policies and CloudWatch Alarms ──────────────────────────────
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "sbom-api-scale-out"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.api_asg.name
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "sbom-api-scale-in"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.api_asg.name
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_alarm" {
  alarm_name          = "HighCPUUsage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Scale out when CPU > 80%"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_asg.name
  }
  alarm_actions = [aws_autoscaling_policy.scale_out.arn]
}

resource "aws_cloudwatch_metric_alarm" "low_cpu_alarm" {
  alarm_name          = "LowCPUUsage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 15
  alarm_description   = "Scale in when CPU < 20%"
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_asg.name
  }
  alarm_actions = [aws_autoscaling_policy.scale_in.arn]
}

# ─── Output Helpers ───────────────────────────────────────
# Used to retreive public IPs of EC2 instances in the ASG
data "aws_instances" "sbom_api" {
  filter {
    name   = "tag:Name"
    values = ["SBOM-API"]
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }

  depends_on = [aws_autoscaling_group.api_asg]
}