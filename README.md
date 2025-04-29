# Final Year Project - Delve - Software Component Analysis via SBOMs and Vulnerability Management

Delve is a secure, cloud-native API designed for **Software Bill of Materials (SBOM)** management and **vulnerability tracking**.  
It enables users to generate, upload, analyze, and organize SBOMs, while automatically scanning for vulnerabilities across open-source and containerized software artifacts.

Built using **Node.js**, **AWS Services**, **Syft**, and **Grype**, Delve empowers software teams to improve their supply chain security posture.

---

## ✨ Features

- 🔒 **User Authentication** using AWS Cognito
- 📄 **Upload and manage SBOM files** (CycloneDX JSON)
- ⚡ **Generate SBOMs** from:
  - Uploaded project archives
  - Docker images
  - OCI archives
  - Container registries
- 🛡️ **Vulnerability scanning** using Grype
- 🗃️ **Organize SBOMs** into user-defined **Projects**
- ☁️ **Store artifacts** securely in Amazon S3
- 🗄️ **Store metadata** in Amazon DynamoDB
- 🛠️ **Infrastructure auto-initialization** on server startup (S3 buckets, DynamoDB tables, Cognito)

---

## 📡 API Routes

The Delve API provides both **public** and **protected** endpoints.

### Root Route

| Method | Route  | Description                   |
|:------:|:------:|:------------------------------:|
| GET    | `/`    | Basic health check ("SBOM API Running!") |

---

### Authentication Routes (Public)

| Method | Route          | Description                        |
|:------:|:--------------:|:----------------------------------:|
| POST   | `/auth/signup`  | Register a new user                |
| POST   | `/auth/login`   | Authenticate an existing user     |
| POST   | `/auth/confirm` | Confirm user registration         |
| POST   | `/auth/logout`  | Logout and revoke refresh token    |

> 🔓 No authentication token required for these routes.

---

### SBOM Management Routes (Protected)

| Method | Route                       | Description                                 |
|:------:|:----------------------------:|:-------------------------------------------:|
| POST   | `/api/uploadSBOM`             | Upload and scan an SBOM file                |
| POST   | `/api/generator/generateSBOM` | Generate an SBOM from archive, docker, or OCI |
| GET    | `/api/my-sboms`               | List user's uploaded SBOMs                  |
| GET    | `/api/my-sboms/:sbomId`        | Retrieve a specific SBOM metadata           |
| DELETE | `/api/my-sboms/:sbomId`        | Delete an uploaded SBOM and its reports     |
| GET    | `/api/:id/parsed`              | Retrieve parsed SBOM and vulnerability report |

> 🔒 Requires JWT authentication (Authorization header).

---

### Project Management Routes (Protected)

| Method | Route                              | Description                              |
|:------:|:----------------------------------:|:----------------------------------------:|
| POST   | `/api/projects/`                   | Create a new project                    |
| GET    | `/api/projects/`                   | List all projects for the authenticated user |
| GET    | `/api/projects/:projectId`          | Get detailed info for a specific project |
| PUT    | `/api/projects/:projectId`          | Update project fields                   |
| DELETE | `/api/projects/:projectId`          | Delete a project                        |
| GET    | `/api/projects/:projectId/sboms`    | List all SBOMs associated with a project |

> 🔒 Requires JWT authentication (Authorization header).

---

## 🛠️ Backend Tech Stack

- **Backend:** Node.js + Express
- **Authentication:** AWS Cognito
- **Storage:** AWS S3
- **Database:** AWS DynamoDB
- **SBOM Generation:** Syft
- **Vulnerability Scanning:** Grype
- **Container Management:** Docker
- **Process Management:** PM2

## 🛠️ Frontend Tech Stack

- **Framework:** React
- **Routing:** React Router
- **HTTP Requests:** Axios
- **Authentication:** JWT Token Storage
- **Component Styling:** Tailwind CSS

---

## 📂 Project Structure

### API Server

```text
/config         => AWS SDK clients
/controllers    => Express route handlers (auth, projects, sboms, generation)
/routes         => Express routers
/services       => Core service logic (S3, DynamoDB, Cognito, Syft, Grype)
/middlewares    => Authentication middleware, file upload handling
/utils          => Helper utilities (metadata extraction, archive utilities)
ExpressAPI.js   => Main server application
.env            => Environment variables
```

### Frontend Server

```text
/src                 => Main frontend codebase
  /api               => Axios API client
  /components        => Reusable UI components (cards, modals, tables, loaders)
  /context           => Global state management using React Context (authentication, user state)
  /hooks             => React UseAuth Hook
  /lib               => Utility library for caching
  /pages             => Core page views (Login, Register, Dashboard, Upload, Generator, SBOM Details)
App.jsx              => Main application entry point and router setup
main.jsx             => Root React DOM renderer
```

---

## 🚀 Deployment Instructions

To launch the Delve application, the following steps must be performed:

### 1. Install Requirements

Ensure that **Terraform** is installed and configured on your host system.  
You can install Terraform via:

```bash
brew install terraform
```

Fetch the latest copy of this code repository through cloning it or via HTTPS:
```
git clone https://github.com/DylBP/SBOM-FYP.git

https://github.com/DylBP/SBOM-FYP/archive/refs/heads/main.zip
```

The AWS CLI must be installed also, and you must have your environment set up using `aws configure` with your region set to `eu-west-1`.

### 2. Prepare Infrastructure Variables

Navigate to the `/infra` directory in the project.

Create a file named **`terraform.tfvars`** with the following content, replacing the placeholder values with your own:

```hcl
# This AMI and the associated snapshot has been made publicly available for this project.
ami_id         = "ami-0f16b8a97a0fe723f"
key_name       = "<Your AWS Key>"
instance_type  = "t2.micro"
vpc_id         = "vpc-xxxYourVPCIDxxx"
public_subnets = ["subnet-xxxYourSubnet1IDxxx", "subnet-xxxYourSubnet2IDxxx"]
```

⚠⚠⚠ Your AWS region must be `eu-west-1` to be able to access this AMI. ⚠⚠⚠

### 3. Initialise and Apply Terraform Configuration

From the `/infra` directory, run the following commands:
```bash
terraform init
terraform plan
terraform apply
```

Infrastructure will be provisioned:
- An EC2 instance will be launched and bootstrapped within your environment
- The user data fetches the latest codebase from GitHub and starts the Delve API

The instance should not be required to be SSH'd into manually unless for troubleshooting.

### 4. Frontend

Navigate to `/frontend/delve-frontend/` and run the following commands:

```bash
npm install
npm run dev
```

Navigate to `/frontend/delve-frontend/api/`, and modify the file named `axios.js` such that
the ALB DNS name from earlier is the base URL.

![Where to put the ALB Donmain name! It's really gotta be here.](https://i.imgur.com/eCmkLPR.png)

---

### 5. Accessing the Application

Once the backend is deployed and the frontend is running, you can access the Delve application in your browser at the localhost URL.

---

## 🧹 Cleanup Instructions
To destroy the AWS infrastructure and remove all provisioned resources:

```bash
cd infra
terraform destroy
```

This will terminate and destroy all provisioned resources.

--- 

## 🛠 Troubleshooting

| Issue | Solution |
|:-----|:---------|
| **AMI not launching / not found** | Ensure your AWS region is `eu-west-1`, and the AMI ID is correct and public. |
| **Cognito errors on login/signup** | Double-check your Cognito App Client ID, User Pool ID, and Client Secret. |
| **API not reachable** | Check security group rules, EC2 instance status, and that PM2 started the Express app. |
| **Frontend can't reach backend** | Make sure the ALB DNS name is set correctly in `/frontend/api/axios.js`. |
| **Terraform apply fails** | Run `terraform init` again, and confirm your AWS credentials are correctly set using `aws configure`. |

---

## Built With 🤍

This project would not have been possible without the following open-source tools and services:

- [Anchore Syft](https://github.com/anchore/syft) — for efficient SBOM generation
- [Anchore Grype](https://github.com/anchore/grype) — for in-depth vulnerability scanning
- [AWS Free Tier](https://aws.amazon.com/free/) — for providing the infrastructure backbone (EC2, S3, DynamoDB, Cognito)
- [React](https://reactjs.org/) — for building a fast and responsive frontend
- [Express](https://expressjs.com/) — for creating a robust backend API
- [Terraform](https://www.terraform.io/) — for Infrastructure as Code automation

Special thanks to the open-source community for providing the tools that made Delve possible.