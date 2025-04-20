variable "aws_region" {
  default = "eu-west-1"
}

variable "sbom_bucket_name" {
  default = "sbom-files"
}

variable "projects_table_name" {
  default = "projects-table"
}

variable "sbom_table_name" {
  default = "sbom-table"
}

variable "ami_id" {
  description = "The ID of the custom AMI"
  type        = string
}

variable "instance_type" {
  default     = "t3.micro"
  description = "The EC2 instance type"
}

variable "key_name" {
  description = "SSH key pair name for access"
  type        = string
}