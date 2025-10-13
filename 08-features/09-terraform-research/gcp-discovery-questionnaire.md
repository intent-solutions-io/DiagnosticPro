# GCP Infrastructure Discovery Questionnaire

**Purpose:** Complete inventory of your Google Cloud Platform infrastructure to prepare for Terraform migration.

**Instructions:**

- Answer all applicable questions
- Use `gcloud` commands provided to gather information
- Mark N/A for sections that don't apply
- Save completed questionnaire as `gcp-inventory-[date].md`

-----

## Section 1: Organization & Project Structure

### 1.1 Organization Details

- [ ] Do you have a GCP Organization? (Yes/No): ______
- [ ] Organization ID (if applicable): ______
- [ ] Organization Display Name: ______

**gcloud command:**

```bash
gcloud organizations list
```

### 1.2 Folder Structure

- [ ] Are you using Folders to organize projects? (Yes/No): ______
- [ ] Number of folders: ______
- [ ] Folder hierarchy (describe or list):

  ```
  Root/
  ├──
  ├──
  └──
  ```

**gcloud command:**

```bash
gcloud resource-manager folders list --organization=[ORG_ID]
```

### 1.3 Projects Inventory

|Project ID|Project Name|Project Number|Environment|Billing Account|Labels/Tags|
|----------|------------|--------------|-----------|---------------|-----------|
|          |            |              |           |               |           |
|          |            |              |           |               |           |
|          |            |              |           |               |           |

**gcloud command:**

```bash
gcloud projects list --format="table(projectId,name,projectNumber,labels)"
```

**For each project, note:**

- [ ] Primary purpose/application: ______
- [ ] Team/department owner: ______
- [ ] Production/Staging/Dev/Test: ______

-----

## Section 2: IAM & Security

### 2.1 Organization-Level IAM

- [ ] Number of organization-level IAM bindings: ______
- [ ] Custom roles defined at org level: ______

**gcloud command:**

```bash
gcloud organizations get-iam-policy [ORG_ID] --format=json > org-iam-policy.json
gcloud iam roles list --organization=[ORG_ID] --format="table(name,title,stage)"
```

### 2.2 Project-Level IAM (Per Project)

**Project:** ______

|Member (User/Group/SA)|Role|Type (Predefined/Custom)|
|----------------------|----|------------------------|
|                      |    |                        |
|                      |    |                        |

**gcloud command:**

```bash
gcloud projects get-iam-policy [PROJECT_ID] --format=json > [PROJECT_ID]-iam-policy.json
```

### 2.3 Service Accounts Inventory

|Service Account Email|Display Name|Project|Used By (Resource)|Keys Exist?|
|---------------------|------------|-------|------------------|-----------|
|                     |            |       |                  |           |
|                     |            |       |                  |           |

**gcloud command:**

```bash
gcloud iam service-accounts list --project=[PROJECT_ID]
gcloud iam service-accounts keys list --iam-account=[SA_EMAIL]
```

### 2.4 Security & Secrets

- [ ] Using Secret Manager? (Yes/No): ______
- [ ] Number of secrets: ______
- [ ] Using VPC Service Controls? (Yes/No): ______
- [ ] Security Command Center enabled? (Yes/No): ______
- [ ] Binary Authorization policies? (Yes/No): ______

**gcloud command:**

```bash
gcloud secrets list --project=[PROJECT_ID]
gcloud access-context-manager policies list --organization=[ORG_ID]
```

-----

## Section 3: Compute Resources

### 3.1 Compute Engine (VMs)

**Total VM instances across all projects:** ______

**Per Project:** ______

|Instance Name|Zone|Machine Type|Image/OS|Disk Size (GB)|Network Tags|Status|
|-------------|----|------------|--------|--------------|------------|------|
|             |    |            |        |              |            |      |
|             |    |            |        |              |            |      |

**gcloud command:**

```bash
gcloud compute instances list --project=[PROJECT_ID] --format="table(name,zone,machineType,status,networkInterfaces[0].network)"
```

**Additional VM Details:**

- [ ] Using instance groups? (Yes/No): ______
- [ ] Managed instance groups (MIGs): ______ (count)
- [ ] Unmanaged instance groups: ______ (count)
- [ ] Auto-scaling enabled on MIGs? (Yes/No): ______
- [ ] Instance templates in use: ______ (count)

**gcloud command:**

```bash
gcloud compute instance-groups managed list --project=[PROJECT_ID]
gcloud compute instance-templates list --project=[PROJECT_ID]
```

### 3.2 Google Kubernetes Engine (GKE)

**Total GKE clusters:** ______

|Cluster Name|Location (Zone/Region)|Version|Node Pools|Total Nodes|Autopilot/Standard|
|------------|----------------------|-------|----------|-----------|------------------|
|            |                      |       |          |           |                  |
|            |                      |       |          |           |                  |

**gcloud command:**

```bash
gcloud container clusters list --project=[PROJECT_ID]
gcloud container clusters describe [CLUSTER_NAME] --zone=[ZONE]
```

**Per Cluster Details:**

- [ ] VPC-native cluster? (Yes/No): ______
- [ ] Private cluster? (Yes/No): ______
- [ ] Workload Identity enabled? (Yes/No): ______
- [ ] GKE Autopilot or Standard: ______
- [ ] Node pool configurations (machine types, disk sizes): ______

### 3.3 Cloud Run

**Total Cloud Run services:** ______

|Service Name|Region|Image|Min Instances|Max Instances|CPU/Memory|Ingress|
|------------|------|-----|-------------|-------------|----------|-------|
|            |      |     |             |             |          |       |
|            |      |     |             |             |          |       |

**gcloud command:**

```bash
gcloud run services list --project=[PROJECT_ID] --platform=managed
```

### 3.4 Cloud Functions

**Total Cloud Functions:** ______

|Function Name|Region|Runtime|Trigger Type|Memory|Timeout|
|-------------|------|-------|------------|------|-------|
|             |      |       |            |      |       |

**gcloud command:**

```bash
gcloud functions list --project=[PROJECT_ID]
```

### 3.5 App Engine

- [ ] App Engine enabled? (Yes/No): ______
- [ ] Environment (Standard/Flexible): ______
- [ ] Runtime: ______
- [ ] Number of services: ______
- [ ] Number of versions: ______

**gcloud command:**

```bash
gcloud app describe --project=[PROJECT_ID]
gcloud app services list --project=[PROJECT_ID]
```

-----

## Section 4: Networking

### 4.1 VPC Networks

**Total VPC networks:** ______

|Network Name|Subnet Mode (Auto/Custom)|Number of Subnets|Regions|Peering Connections|
|------------|-------------------------|-----------------|-------|-------------------|
|            |                         |                 |       |                   |
|            |                         |                 |       |                   |

**gcloud command:**

```bash
gcloud compute networks list --project=[PROJECT_ID]
gcloud compute networks describe [NETWORK_NAME] --project=[PROJECT_ID]
```

### 4.2 Subnets Inventory

**Per VPC Network:** ______

|Subnet Name|Region|IP CIDR Range|Private Google Access|Flow Logs|
|-----------|------|-------------|---------------------|---------|
|           |      |             |                     |         |
|           |      |             |                     |         |

**gcloud command:**

```bash
gcloud compute networks subnets list --network=[NETWORK_NAME] --project=[PROJECT_ID]
```

### 4.3 Firewall Rules

**Total firewall rules:** ______

|Rule Name|Network|Direction|Priority|Source/Dest|Protocols/Ports|Target Tags|
|---------|-------|---------|--------|-----------|---------------|-----------|
|         |       |         |        |           |               |           |
|         |       |         |        |           |               |           |

**gcloud command:**

```bash
gcloud compute firewall-rules list --project=[PROJECT_ID] --format="table(name,network,direction,priority,sourceRanges.list():label=SRC_RANGES,allowed[].map().firewall_rule().list():label=ALLOW)"
```

### 4.4 Load Balancers

**Total load balancers:** ______

|LB Name|Type (HTTP(S)/TCP/UDP/Internal)|Backend Services|Frontend IP|SSL Certificates|
|-------|-------------------------------|----------------|-----------|----------------|
|       |                               |                |           |                |
|       |                               |                |           |                |

**gcloud command:**

```bash
gcloud compute forwarding-rules list --project=[PROJECT_ID]
gcloud compute backend-services list --project=[PROJECT_ID]
gcloud compute url-maps list --project=[PROJECT_ID]
gcloud compute target-https-proxies list --project=[PROJECT_ID]
```

### 4.5 Cloud NAT

- [ ] Cloud NAT gateways configured? (Yes/No): ______
- [ ] Number of NAT gateways: ______

|NAT Gateway Name|Region|Router|NAT IP Allocation|Subnets|
|----------------|------|------|-----------------|-------|
|                |      |      |                 |       |

**gcloud command:**

```bash
gcloud compute routers list --project=[PROJECT_ID]
gcloud compute routers nats list --router=[ROUTER_NAME] --region=[REGION]
```

### 4.6 VPN & Interconnect

- [ ] Cloud VPN tunnels? (Yes/No): ______
- [ ] Number of VPN tunnels: ______
- [ ] Dedicated Interconnect? (Yes/No): ______
- [ ] Partner Interconnect? (Yes/No): ______

**gcloud command:**

```bash
gcloud compute vpn-tunnels list --project=[PROJECT_ID]
gcloud compute interconnects list --project=[PROJECT_ID]
```

### 4.7 DNS

- [ ] Cloud DNS zones configured? (Yes/No): ______
- [ ] Number of managed zones: ______

|Zone Name|DNS Name|Type (Public/Private)|DNSSEC|
|---------|--------|---------------------|------|
|         |        |                     |      |

**gcloud command:**

```bash
gcloud dns managed-zones list --project=[PROJECT_ID]
```

### 4.8 IP Addresses

**Static External IPs:** ______
**Static Internal IPs:** ______

|IP Address|Name|Region|In Use By|Type (Ephemeral/Static)|
|----------|----|------|---------|-----------------------|
|          |    |      |         |                       |

**gcloud command:**

```bash
gcloud compute addresses list --project=[PROJECT_ID]
```

-----

## Section 5: Storage & Databases

### 5.1 Cloud Storage (GCS)

**Total buckets:** ______

|Bucket Name|Location|Storage Class|Versioning|Lifecycle Rules|Public Access|Size (GB)|
|-----------|--------|-------------|----------|---------------|-------------|---------|
|           |        |             |          |               |             |         |
|           |        |             |          |               |             |         |

**gcloud command:**

```bash
gsutil ls -p [PROJECT_ID]
gsutil du -s gs://[BUCKET_NAME]
gsutil versioning get gs://[BUCKET_NAME]
gsutil lifecycle get gs://[BUCKET_NAME]
```

### 5.2 Persistent Disks

**Total persistent disks:** ______

|Disk Name|Zone|Size (GB)|Type (pd-standard/ssd)|Attached To|Snapshots|
|---------|----|---------|----------------------|-----------|---------|
|         |    |         |                      |           |         |

**gcloud command:**

```bash
gcloud compute disks list --project=[PROJECT_ID]
gcloud compute snapshots list --project=[PROJECT_ID]
```

### 5.3 Cloud SQL

**Total Cloud SQL instances:** ______

|Instance Name|Database Type|Version|Region|Tier/Machine Type|Storage (GB)|HA Enabled|Backups|
|-------------|-------------|-------|------|-----------------|------------|----------|-------|
|             |             |       |      |                 |            |          |       |

**gcloud command:**

```bash
gcloud sql instances list --project=[PROJECT_ID]
gcloud sql instances describe [INSTANCE_NAME] --project=[PROJECT_ID]
```

**Additional SQL Details:**

- [ ] Private IP configured? (Yes/No): ______
- [ ] Read replicas: ______ (count)
- [ ] Automated backups schedule: ______
- [ ] Point-in-time recovery enabled? (Yes/No): ______

### 5.4 Cloud Spanner

- [ ] Cloud Spanner instances? (Yes/No): ______
- [ ] Number of instances: ______

|Instance Name|Configuration|Nodes/Processing Units|Databases|
|-------------|-------------|----------------------|---------|
|             |             |                      |         |

**gcloud command:**

```bash
gcloud spanner instances list --project=[PROJECT_ID]
```

### 5.5 Firestore / Datastore

- [ ] Firestore/Datastore enabled? (Yes/No): ______
- [ ] Mode (Native/Datastore): ______
- [ ] Number of collections/kinds: ______
- [ ] Composite indexes: ______ (count)

**gcloud command:**

```bash
gcloud firestore databases list --project=[PROJECT_ID]
gcloud datastore indexes list --project=[PROJECT_ID]
```

### 5.6 BigQuery

- [ ] BigQuery datasets? (Yes/No): ______
- [ ] Number of datasets: ______

|Dataset Name|Location|Tables Count|Size (GB)|Data Expiration|
|------------|--------|------------|---------|---------------|
|            |        |            |         |               |

**gcloud command:**

```bash
bq ls --project_id=[PROJECT_ID]
bq show --format=prettyjson [DATASET_NAME]
```

### 5.7 Filestore

- [ ] Filestore instances? (Yes/No): ______
- [ ] Number of instances: ______

|Instance Name|Zone|Tier|Capacity (GB)|Network|
|-------------|----|----|-------------|-------|
|             |    |    |             |       |

**gcloud command:**

```bash
gcloud filestore instances list --project=[PROJECT_ID]
```

### 5.8 Memorystore (Redis/Memcached)

- [ ] Memorystore instances? (Yes/No): ______
- [ ] Type (Redis/Memcached): ______

|Instance Name|Region|Tier|Memory (GB)|Version|
|-------------|------|----|-----------|-------|
|             |      |    |           |       |

**gcloud command:**

```bash
gcloud redis instances list --project=[PROJECT_ID]
gcloud memcache instances list --project=[PROJECT_ID]
```

-----

## Section 6: Monitoring, Logging & Operations

### 6.1 Cloud Monitoring

- [ ] Custom dashboards: ______ (count)
- [ ] Alerting policies: ______ (count)
- [ ] Uptime checks: ______ (count)
- [ ] Notification channels configured: ______ (count)

**gcloud command:**

```bash
gcloud alpha monitoring policies list --project=[PROJECT_ID]
gcloud alpha monitoring channels list --project=[PROJECT_ID]
```

### 6.2 Cloud Logging

- [ ] Log sinks configured: ______ (count)
- [ ] Log exclusions: ______ (count)
- [ ] Logs retention period: ______ days

|Sink Name|Destination Type|Destination|Filter|
|---------|----------------|-----------|------|
|         |                |           |      |

**gcloud command:**

```bash
gcloud logging sinks list --project=[PROJECT_ID]
```

### 6.3 Error Reporting

- [ ] Error Reporting enabled? (Yes/No): ______
- [ ] Applications reporting errors: ______

### 6.4 Cloud Trace & Profiler

- [ ] Cloud Trace enabled? (Yes/No): ______
- [ ] Cloud Profiler enabled? (Yes/No): ______

-----

## Section 7: CI/CD & DevOps

### 7.1 Cloud Build

- [ ] Cloud Build triggers: ______ (count)
- [ ] Build history retention: ______ days

|Trigger Name|Repository|Branch/Tag|Build Config|
|------------|----------|----------|------------|
|            |          |          |            |

**gcloud command:**

```bash
gcloud builds triggers list --project=[PROJECT_ID]
```

### 7.2 Artifact Registry / Container Registry

- [ ] Using Artifact Registry? (Yes/No): ______
- [ ] Using Container Registry (deprecated)? (Yes/No): ______
- [ ] Number of repositories: ______

|Repository Name|Format (Docker/Maven/npm)|Location|
|---------------|-------------------------|--------|
|               |                         |        |

**gcloud command:**

```bash
gcloud artifacts repositories list --project=[PROJECT_ID]
gcloud container images list --project=[PROJECT_ID]
```

### 7.3 Source Repositories

- [ ] Cloud Source Repositories in use? (Yes/No): ______
- [ ] Number of repositories: ______

**gcloud command:**

```bash
gcloud source repos list --project=[PROJECT_ID]
```

-----

## Section 8: APIs & Services

### 8.1 Enabled APIs

**List all enabled APIs:**

**gcloud command:**

```bash
gcloud services list --enabled --project=[PROJECT_ID] > enabled-apis.txt
```

**Critical APIs to note:**

- [ ] Compute Engine API
- [ ] Kubernetes Engine API
- [ ] Cloud SQL Admin API
- [ ] Cloud Storage API
- [ ] Cloud Run API
- [ ] Service Networking API
- [ ] Cloud Resource Manager API
- [ ] IAM API
- [ ] Others: ______

### 8.2 API Keys

- [ ] API keys in use: ______ (count)
- [ ] Restrictions applied? (Yes/No): ______

**gcloud command:**

```bash
gcloud alpha services api-keys list --project=[PROJECT_ID]
```

-----

## Section 9: Billing & Cost Management

### 9.1 Billing Account

- [ ] Billing Account ID: ______
- [ ] Billing Account Name: ______

**gcloud command:**

```bash
gcloud billing accounts list
gcloud billing projects describe [PROJECT_ID]
```

### 9.2 Budgets & Alerts

- [ ] Budget alerts configured? (Yes/No): ______
- [ ] Budget amount: ______
- [ ] Alert thresholds: ______

### 9.3 Cost Insights

- [ ] Average monthly spend: ______
- [ ] Top 3 cost drivers:
1. -----
1. -----
1. -----

-----

## Section 10: Compliance & Governance

### 10.1 Organization Policies

- [ ] Organization policies enforced? (Yes/No): ______
- [ ] Number of policies: ______

**gcloud command:**

```bash
gcloud resource-manager org-policies list --organization=[ORG_ID]
```

**Key policies to document:**

- [ ] Restrict VM external IPs
- [ ] Require OS Login
- [ ] Restrict public IP on Cloud SQL
- [ ] Allowed resource locations
- [ ] Others: ______

### 10.2 Labels & Tags

- [ ] Labeling strategy in place? (Yes/No): ______
- [ ] Standard labels used:
  - Environment: ______
  - Owner: ______
  - Cost Center: ______
  - Application: ______
  - Others: ______

### 10.3 Audit Logging

- [ ] Admin Activity logs enabled: Yes (always on)
- [ ] Data Access logs enabled? (Yes/No): ______
- [ ] System Event logs enabled: Yes (always on)
- [ ] Access Transparency logs? (Yes/No): ______

-----

## Section 11: Additional Services

### 11.1 Cloud Pub/Sub

- [ ] Pub/Sub topics: ______ (count)
- [ ] Subscriptions: ______ (count)

|Topic Name|Subscriptions|Message Retention|Encryption|
|----------|-------------|-----------------|----------|
|          |             |                 |          |

**gcloud command:**

```bash
gcloud pubsub topics list --project=[PROJECT_ID]
gcloud pubsub subscriptions list --project=[PROJECT_ID]
```

### 11.2 Cloud Scheduler

- [ ] Scheduled jobs: ______ (count)

|Job Name|Schedule (Cron)|Target Type|Region|
|--------|---------------|-----------|------|
|        |               |           |      |

**gcloud command:**

```bash
gcloud scheduler jobs list --project=[PROJECT_ID]
```

### 11.3 Cloud Tasks

- [ ] Task queues: ______ (count)

**gcloud command:**

```bash
gcloud tasks queues list --project=[PROJECT_ID]
```

### 11.4 Cloud Composer (Managed Airflow)

- [ ] Composer environments? (Yes/No): ______
- [ ] Number of environments: ______

**gcloud command:**

```bash
gcloud composer environments list --project=[PROJECT_ID]
```

### 11.5 Dataflow

- [ ] Dataflow jobs running? (Yes/No): ______
- [ ] Number of active jobs: ______

**gcloud command:**

```bash
gcloud dataflow jobs list --project=[PROJECT_ID]
```

### 11.6 Cloud CDN

- [ ] Cloud CDN enabled? (Yes/No): ______
- [ ] Backend buckets/services: ______ (count)

**gcloud command:**

```bash
gcloud compute backend-buckets list --project=[PROJECT_ID]
```

### 11.7 Cloud Armor

- [ ] Security policies: ______ (count)

**gcloud command:**

```bash
gcloud compute security-policies list --project=[PROJECT_ID]
```

-----

## Section 12: Migration Readiness Assessment

### 12.1 Documentation Status

- [ ] Architecture diagrams available? (Yes/No): ______
- [ ] Network diagrams available? (Yes/No): ______
- [ ] Disaster recovery plans? (Yes/No): ______
- [ ] Runbooks/SOPs? (Yes/No): ______

### 12.2 Current Pain Points

List current infrastructure management challenges:

1. -----
1. -----
1. -----

### 12.3 Terraform Readiness

- [ ] Team Terraform experience level: ______
- [ ] Existing IaC in place? (Yes/No): ______
- [ ] Version control system (Git, etc.): ______
- [ ] CI/CD pipeline exists? (Yes/No): ______

### 12.4 Testing Environments

- [ ] Can safely test Terraform in non-prod? (Yes/No): ______
- [ ] Clone/snapshot capabilities tested? (Yes/No): ______

### 12.5 Priorities for Terraform

Rank what you want to Terraform first (1=highest priority):

- [ ] __ Compute (VMs, GKE)
- [ ] __ Networking (VPC, firewall rules)
- [ ] __ Storage (GCS, disks)
- [ ] __ Databases (Cloud SQL)
- [ ] __ IAM (roles, service accounts)
- [ ] __ Monitoring (alerts, dashboards)

-----

## Completion Checklist

- [ ] All sections completed
- [ ] gcloud commands executed and output saved
- [ ] Screenshots/exports saved for complex configurations
- [ ] Stakeholder review completed
- [ ] Questions/unknowns documented
- [ ] Ready to proceed with Terraform migration planning

-----

**Completed By:** ______________________
**Date:** ______________________
**Next Steps:** Share this document with your Terraform migration team to begin phase planning.

-----

## Helper: Bulk Export Commands

Run these commands to generate comprehensive exports:

```bash
# Export all IAM policies
for project in $(gcloud projects list --format="value(projectId)"); do
  echo "Exporting IAM for $project"
  gcloud projects get-iam-policy $project --format=json > "iam-${project}.json"
done

# Export all compute resources
gcloud compute instances list --format=json > compute-instances.json
gcloud compute disks list --format=json > compute-disks.json
gcloud compute networks list --format=json > networks.json
gcloud compute firewall-rules list --format=json > firewall-rules.json

# Export all GKE clusters
gcloud container clusters list --format=json > gke-clusters.json

# Export all Cloud SQL instances
gcloud sql instances list --format=json > cloudsql-instances.json

# Export all storage buckets
gsutil ls -p [PROJECT_ID] -L -b > gcs-buckets.txt

# Export enabled services
gcloud services list --enabled --format=json > enabled-services.json
```

**These exports will be invaluable during Terraform code generation.**