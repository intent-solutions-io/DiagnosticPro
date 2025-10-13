# 🏗️ Architecture Decision Record (ADR)

**Metadata**
- Last Updated: 2025-10-06
- Maintainer: DiagnosticPro DevOps Team
- Related Docs: 01_prd.md, 06_architecture.md

> **🎯 Purpose**
> This ADR documents the decision to migrate DiagnosticPro from manual deployment processes to a fully automated GitOps-based CI/CD pipeline using GitHub Actions and Google Cloud Platform services.

---

## 📋 ADR Metadata

| Field | Value |
|-------|-------|
| **ADR Number** | ADR-001 |
| **Title** | Migrate to GitOps CI/CD Pipeline with GitHub Actions and Secret Manager |
| **Status** | 🟢 Accepted |
| **Date** | 2025-10-06 |
| **Authors** | Sarah Chen (DevOps Engineer), David Kim (Platform Lead) |
| **Reviewers** | Engineering Leadership, Security Team |
| **Stakeholders** | DevOps Team, Frontend Team, Backend Team, Security Team |

### Status Definitions
- **🟡 Proposed:** Under discussion and review
- **🟢 Accepted:** Approved and ready for implementation
- **🔴 Deprecated:** No longer recommended for new implementations
- **🔄 Superseded:** Replaced by a newer ADR (link to replacement)

---

## 🎯 1. Decision Summary

### 1.1 Executive Summary
**Decision:** Migrate DiagnosticPro from manual SSH-based deployments to automated GitOps CI/CD using GitHub Actions, Google Secret Manager, and Cloud Build.

**Impact:** Reduces deployment time from 45 minutes to 5 minutes, eliminates manual errors, and establishes security-first secret management.

**Timeline:** This decision takes effect October 7, 2025 with Sprint 1 implementation.

### 1.2 Decision Statement
> **We will** implement automated GitOps CI/CD using GitHub Actions with Google Secret Manager and Cloud Build **in order to** achieve faster, safer, and more reliable deployments while reducing human error **accepting that** we will incur initial team training overhead and require careful secret migration planning.

---

## 🔍 2. Context & Problem Statement

### 2.1 Business Context
- **Strategic Goals:** Scale DiagnosticPro to support 10,000+ customers/month with 99.9% uptime
- **Market Drivers:** Competitive pressure demands faster feature delivery (<2 week cycles)
- **Timeline Pressures:** Q4 2025 major feature release requires reliable deployment pipeline
- **Resource Constraints:** 3-person DevOps team supporting 15 developers across 5 services

### 2.2 Technical Context
- **Current Architecture:** Manual SSH deployments to Google Cloud Run and Firebase Hosting
- **Pain Points:**
  - 45-minute manual deployment process (30% of developer time)
  - Human errors cause 3-4 rollbacks per month
  - Secrets scattered across developer machines and .env files
  - No automated rollback capability
  - Inconsistent deployment environments (dev/staging/prod drift)
- **Scale Requirements:** 1,000 req/s peak load, 99.9% availability, <200ms response time
- **Integration Needs:** Firebase Hosting, Cloud Run, Firestore, Vertex AI, Stripe webhooks

### 2.3 Problem Statement
**Core Problem:** Manual deployment processes create deployment bottlenecks, increase error rates, expose security vulnerabilities through scattered secrets, and prevent rapid iteration on customer-facing features.

**Success Criteria:** How we'll know this decision succeeded
- Deployment time: 45 minutes → 5 minutes (89% reduction)
- Error rate: 3-4 rollbacks/month → <1 rollback/month (75% reduction)
- MTTR: 120 minutes → 15 minutes (88% reduction)
- Secret exposure risk: High → Low (zero secrets in repositories)

### 2.4 Constraints & Requirements
**Hard Constraints:**
- [x] All secrets must be stored in Google Secret Manager (compliance requirement)
- [x] Zero secrets in GitHub repositories or developer machines
- [x] Automated rollback capability required
- [x] Preserve Firebase Hosting for frontend (existing production domain)
- [x] Support multiple environments (dev, staging, prod)

**Soft Constraints:**
- [x] Prefer GitHub Actions over Jenkins (team familiarity)
- [x] Minimize infrastructure costs (<$500/month additional spend)
- [x] Reuse existing GCP project (diagnostic-pro-prod)

---

## 💭 3. Decision Drivers

### 3.1 Technical Drivers
| Driver | Weight | Description |
|--------|--------|-------------|
| **Performance** | High | Deploy in <5 minutes, enable rapid iteration |
| **Scalability** | High | Handle 50+ deployments/week without bottlenecks |
| **Maintainability** | High | Reduce operational overhead from 30% to <5% developer time |
| **Security** | Critical | Eliminate secrets from repositories, centralized secret rotation |
| **Reliability** | High | 99.9% deployment success rate, automated rollback |

### 3.2 Business Drivers
| Driver | Weight | Description |
|--------|--------|-------------|
| **Time to Market** | Critical | Release features 5x faster (weekly vs monthly) |
| **Cost** | High | Reduce deployment costs $8,500/month → $5,000/month |
| **Risk** | Critical | Eliminate human error, comply with security standards |
| **Team Skills** | Medium | Leverage existing GitHub/GCP knowledge |

### 3.3 Quality Attributes
Using Architecture Tradeoff Analysis Method (ATAM):

| Quality Attribute | Current State | Target State | Priority |
|-------------------|---------------|--------------|----------|
| **Performance** | 45-min deploy | 5-min deploy | Critical |
| **Availability** | 99.5% uptime | 99.9% uptime | High |
| **Security** | Scattered secrets | Secret Manager | Critical |
| **Modifiability** | Manual scripts | GitOps IaC | High |
| **Usability** | Complex manual | Git push → deploy | Medium |

---

## 🛠️ 4. Considered Alternatives

### 4.1 Option 1: GitHub Actions + Secret Manager + Cloud Build (CHOSEN)
**Description:** Implement GitOps CI/CD using GitHub Actions for orchestration, Google Secret Manager for secrets, Cloud Build for container builds, and Terraform for infrastructure as code.

**Pros:**
- ✅ Native GitHub integration (team already uses GitHub for code)
- ✅ Free for public repos, $0.008/minute for private (cost-effective)
- ✅ Secret Manager provides centralized secret management with audit logging
- ✅ Cloud Build optimized for Google Cloud (faster container builds)
- ✅ Terraform enables infrastructure versioning and reproducibility

**Cons:**
- ❌ Initial learning curve for GitHub Actions workflows (mitigated with training)
- ❌ Terraform state management complexity (mitigated with GCS backend)

**Cost Analysis:**
- Development: 160 hours × $85/hr = $13,600 (one-time)
- Infrastructure: $450/month (GitHub Actions + Cloud Build minutes)
- Maintenance: 8 hours/month × $85/hr = $680/month

**Risk Assessment:**
- Technical Risk: Low (proven technologies with extensive documentation)
- Implementation Risk: Medium (requires careful secret migration)
- Operational Risk: Low (GCP SLA 99.95%, GitHub Actions SLA 99.9%)

### 4.2 Option 2: Jenkins + Vault + Cloud Build
**Description:** Self-hosted Jenkins for CI/CD orchestration, HashiCorp Vault for secret management, Cloud Build for container builds.

**Pros:**
- ✅ Greater control over pipeline execution
- ✅ Vault provides advanced secret management features

**Cons:**
- ❌ Requires dedicated Jenkins infrastructure (Compute Engine instance: $150/month)
- ❌ Vault adds operational complexity (dedicated cluster, backup, rotation)
- ❌ Team unfamiliar with Jenkins (steep learning curve)
- ❌ Higher maintenance overhead (infrastructure management)

**Why Rejected:** Higher operational complexity, increased infrastructure costs, steeper learning curve for team, no clear advantages over GitHub Actions for our scale.

### 4.3 Option 3: GitLab CI/CD + Secret Manager
**Description:** Migrate repositories to GitLab, use GitLab CI/CD for pipeline orchestration, Secret Manager for secrets.

**Pros:**
- ✅ All-in-one platform (Git + CI/CD + Container Registry)
- ✅ Strong CI/CD features with visual pipeline editor

**Cons:**
- ❌ Requires migrating all repositories from GitHub (high migration risk)
- ❌ Team must learn new Git platform (workflow disruption)
- ❌ GitLab pricing: $19/user/month for 15 developers = $285/month
- ❌ Loss of GitHub ecosystem integrations (Dependabot, Copilot)

**Why Rejected:** Repository migration risk too high, team disruption significant, higher cost with no clear technical advantages over GitHub Actions.

### 4.4 Do Nothing (Status Quo)
**Description:** Continue with manual SSH-based deployments using bash scripts and scattered .env files.

**Pros:**
- ✅ No implementation cost
- ✅ No disruption to current operations
- ✅ Team familiar with existing process

**Cons:**
- ❌ Deployment bottlenecks prevent scaling (45 minutes per deploy)
- ❌ Security vulnerabilities accumulate (secrets in repositories)
- ❌ Human errors persist (3-4 rollbacks/month costing 8-12 hours each)
- ❌ Competitive disadvantage (competitors deploy 10x faster)
- ❌ Cannot meet 99.9% uptime SLA with manual processes

**Why Rejected:** Status quo is unsustainable for Q4 scale targets, security posture deteriorating, competitive pressure demands faster iteration.

---

## 📊 5. Decision Matrix

### 5.1 Evaluation Criteria
| Criteria | Weight | Option 1 (GitHub) | Option 2 (Jenkins) | Option 3 (GitLab) | Status Quo |
|----------|--------|-------------------|-------------------|-------------------|------------|
| **Deployment Speed** | 25% | 9 (5 min) | 8 (6 min) | 9 (5 min) | 2 (45 min) |
| **Security Posture** | 25% | 9 (Secret Mgr) | 9 (Vault) | 9 (Secret Mgr) | 3 (Scattered) |
| **Implementation Speed** | 15% | 8 (2 weeks) | 5 (6 weeks) | 6 (4 weeks) | 10 (0 weeks) |
| **Cost Effectiveness** | 15% | 8 ($450/mo) | 6 ($850/mo) | 7 ($650/mo) | 9 ($0/mo) |
| **Team Familiarity** | 10% | 9 (GitHub experts) | 4 (Jenkins new) | 5 (GitLab new) | 10 (Current) |
| **Maintenance Overhead** | 10% | 8 (Low) | 5 (High) | 7 (Medium) | 3 (Very High) |
| **Weighted Score** | **100%** | **8.4** | **6.7** | **7.6** | **5.1** |

*Scoring: 1-10 scale where 10 is best*

### 5.2 Decision Rationale
Based on the weighted analysis, **Option 1 (GitHub Actions + Secret Manager)** scores highest (8.4) primarily due to:
- Superior deployment speed (5 minutes vs 45 minutes current state)
- Strong security with Secret Manager integration (centralizes all secrets)
- Fast implementation timeline (2 weeks vs 6 weeks for Jenkins)
- Team expertise with GitHub ecosystem (minimizes learning curve)
- Cost-effective infrastructure ($450/month vs $850 for Jenkins)

While Option 3 (GitLab) scores well on deployment speed, the repository migration risk and team disruption make it unsuitable. Option 2 (Jenkins) adds significant operational complexity without clear advantages.

---

## ⚡ 6. Consequences & Impact

### 6.1 Positive Consequences
**Immediate Benefits:**
- Deployment time reduction from 45 minutes to 5 minutes (within 2 weeks of implementation)
- Automated rollback capability (30-second recovery from failures)
- Centralized secret management eliminates scattered .env files (immediate security improvement)

**Long-term Benefits:**
- Enable weekly release cadence (vs monthly current state)
- 99.9% deployment success rate (vs 75% current state)
- Developer productivity increase 30% (reduced deployment overhead)
- Infrastructure costs reduced $3,500/month (automation efficiency)

### 6.2 Negative Consequences
**Immediate Challenges:**
- Team training required for GitHub Actions workflows (mitigated with 2-day workshop)
- Secret migration from .env files requires careful planning (mitigated with migration checklist)
- Initial pipeline failures during tuning period (mitigated with staging environment testing)

**Long-term Concerns:**
- GitHub Actions vendor lock-in risk (mitigated with workflow standardization allowing future migration)
- Terraform state management complexity (mitigated with GCS backend and state locking)
- GitHub Actions minutes costs scale with usage (mitigated with monthly budget alerts)

### 6.3 Impact Assessment

#### Team Impact
| Team | Impact Level | Specific Changes | Support Needed |
|------|--------------|------------------|----------------|
| **Frontend** | Medium | Update deployment scripts, learn GitHub Actions syntax | 4-hour training session |
| **Backend** | Medium | Migrate secrets to Secret Manager, update Cloud Run configs | 4-hour training session |
| **DevOps** | High | Design and implement CI/CD pipelines, manage Terraform state | Dedicated Sprint 1 focus |
| **QA** | Low | Use staging environment for testing, learn rollback procedures | 2-hour overview session |

#### System Impact
| System | Impact Level | Required Changes | Timeline |
|--------|--------------|------------------|----------|
| **Firebase Hosting** | Low | GitHub Actions deployment workflow | Week 1 |
| **Cloud Run Backend** | High | Secret Manager integration, Cloud Build configs | Week 2-3 |
| **Firestore** | Low | Terraform resource definitions | Week 2 |
| **Stripe Webhooks** | Medium | Secret rotation procedures, webhook endpoint updates | Week 3 |

#### Performance Impact
| Metric | Current | Expected | Timeline |
|--------|---------|----------|----------|
| **Deployment Time** | 45 minutes | 5 minutes | 2 weeks |
| **MTTR** | 120 minutes | 15 minutes | 2 weeks |
| **Deployment Success** | 75% | 99% | 4 weeks |
| **Release Frequency** | 1/month | 4-8/month | 4 weeks |

---

## 🚀 7. Implementation Plan

### 7.1 Implementation Phases
**Phase 1: Foundation (Weeks 1-2) - Sprint 1**
- [x] Set up GitHub Actions workflows for frontend and backend
- [x] Migrate secrets to Google Secret Manager (stripe-secret, stripe-webhook-secret)
- [x] Configure Cloud Build for container builds
- [x] Implement basic deployment pipeline (dev → staging → prod)
- **Exit Criteria:** Successful deployment to staging environment via GitHub Actions

**Phase 2: Migration (Weeks 3-4) - Sprint 2**
- [ ] Deploy Terraform infrastructure as code (Firestore, Cloud Run, Secret Manager)
- [ ] Implement automated testing gates (lint, test, type-check)
- [ ] Configure monitoring and alerting (Cloud Monitoring integration)
- [ ] Gradual production traffic shift (10% → 50% → 100%)
- **Exit Criteria:** 50% of production deployments via automated pipeline

**Phase 3: Optimization (Weeks 5-6) - Sprint 3**
- [ ] Implement automated rollback on failure detection
- [ ] Performance tuning (parallel build stages, caching)
- [ ] Complete migration documentation and runbooks
- [ ] Developer onboarding automation (setup scripts)
- **Exit Criteria:** Full migration with <5 minute average deployment time

### 7.2 Success Metrics
| Metric | Target | Measurement Method | Review Date |
|--------|--------|--------------------|-------------|
| **Deployment Time** | <5 minutes | GitHub Actions execution time | Nov 15, 2025 |
| **Deployment Success Rate** | >99% | GitHub Actions job success/failure ratio | Nov 15, 2025 |
| **MTTR** | <15 minutes | Incident response time tracking | Nov 15, 2025 |
| **Developer Satisfaction** | >8.5/10 | Anonymous survey post-Sprint 3 | Nov 18, 2025 |

### 7.3 Risk Mitigation
| Risk | Mitigation Strategy | Owner | Status |
|------|-------------------|-------|--------|
| **Secret migration errors** | Comprehensive migration checklist, staging environment testing | Sarah Chen | Planned |
| **Deployment pipeline failures** | Gradual rollout (10% → 50% → 100%), automated rollback | David Kim | Planned |
| **Team productivity drop** | 2-day training workshop, pair programming for first deployments | Sarah Chen | Scheduled Oct 7-8 |
| **GitHub Actions downtime** | Maintain manual deployment runbook as emergency backup | DevOps Team | Documented |

---

## 🔄 8. Review & Evolution

### 8.1 Review Schedule
- **30-Day Review (Nov 6, 2025):** Pipeline reliability assessment, developer feedback collection
- **90-Day Review (Jan 6, 2026):** Cost analysis, performance optimization opportunities
- **1-Year Review (Oct 6, 2026):** Strategic value assessment, next-generation tooling evaluation

### 8.2 Decision Review Criteria
**Trigger Events for Review:**
- [ ] Deployment success rate falls below 95% for 2 consecutive weeks
- [ ] GitHub Actions costs exceed $800/month budget
- [ ] GitHub Actions experiences >4 hours downtime
- [ ] Team grows beyond 30 developers (scale reassessment needed)
- [ ] Google Cloud announces better-integrated CI/CD solution

### 8.3 Success Criteria Validation
| Success Criteria | Target | Actual | Status | Notes |
|------------------|---------|---------|--------|-------|
| Deployment time reduction | <5 minutes | TBD | Pending | Track post-Sprint 1 |
| Error rate reduction | <1 rollback/month | TBD | Pending | Track post-Sprint 2 |
| MTTR improvement | <15 minutes | TBD | Pending | Track post-Sprint 3 |
| Secret exposure elimination | Zero secrets in repos | TBD | Pending | Audit after migration |

### 8.4 Evolution Path
**Next Logical Steps:**
1. Implement canary deployments for progressive rollout (Q1 2026)
2. Add automated performance regression testing (Q2 2026)
3. Explore multi-region deployment strategies (Q3 2026)

**Deprecation Plan:**
- **Trigger:** GitHub Actions fails to meet scale requirements (>50 deploys/day)
- **Timeline:** Expected 3-5 year lifespan before next-generation tooling needed
- **Successor:** Likely Google Cloud Deploy (native GCP CI/CD) or Argo CD (Kubernetes-native GitOps)

---

## 📚 9. Related Decisions & References

### 9.1 Related ADRs
- **ADR-002:** Terraform for Infrastructure as Code (in progress)
- **ADR-003:** Monitoring and Observability Strategy (planned Q4 2025)
- **ADR-004:** Multi-Environment Deployment Strategy (planned Q1 2026)

### 9.2 Supporting Documentation
- **Architecture Diagrams:** `/claudes-docs/devops-maintenance/diagrams/ci-cd-pipeline.png`
- **Proof of Concept:** GitHub Actions prototype tested in staging environment (Oct 1-3, 2025)
- **Performance Benchmarks:** `/claudes-docs/devops-maintenance/benchmarks/deployment-times.csv`
- **Security Analysis:** Secret Manager security review (Sept 28, 2025)

### 9.3 External References
- **Standards:** NIST SP 800-204 Security Strategies for Microservices
- **Research Papers:** "GitOps: A Modern Approach to Infrastructure Automation" (Weaveworks, 2023)
- **Vendor Documentation:**
  - GitHub Actions: https://docs.github.com/en/actions
  - Google Secret Manager: https://cloud.google.com/secret-manager/docs
  - Cloud Build: https://cloud.google.com/build/docs
  - Terraform GCP Provider: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- **Community Discussions:**
  - r/devops GitOps best practices thread
  - Stack Overflow: "GitHub Actions vs Jenkins for Google Cloud deployments"

### 9.4 Decision Artifacts
```
artifacts/
├── performance-benchmarks/
│   ├── current-state-metrics.json        # Manual deployment baseline
│   ├── github-actions-benchmark.json     # Prototype deployment times
│   └── jenkins-benchmark.json            # Jenkins comparison test
├── prototypes/
│   ├── github-actions-poc/               # Working GitHub Actions workflows
│   │   ├── frontend-deploy.yml
│   │   ├── backend-deploy.yml
│   │   └── secret-manager-integration.yml
│   └── terraform-poc/                    # Terraform resource definitions
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── analysis/
    ├── cost-benefit-analysis.xlsx        # 5-year TCO comparison
    └── risk-assessment.md                # Detailed risk analysis
```

---

## 👥 10. Stakeholder Sign-off

### 10.1 Review Process
| Role | Reviewer | Date | Status | Comments |
|------|----------|------|--------|----------|
| **Architecture Review Board** | David Kim (Platform Lead) | 2025-10-05 | ✅ Approved | Technical approach sound |
| **Technical Lead** | Sarah Chen (DevOps) | 2025-10-05 | ✅ Approved | Implementation plan detailed |
| **Product Owner** | Alex Martinez | 2025-10-05 | ✅ Approved | Aligns with Q4 roadmap |
| **Security Team** | Jordan Lee (Security Engineer) | 2025-10-05 | ✅ Approved | Secret Manager compliance confirmed |
| **DevOps Lead** | Sarah Chen | 2025-10-06 | ✅ Approved | Ready for Sprint 1 kickoff |

### 10.2 Approval Status
- [x] **Technical Review:** Architecture team approval (David Kim, Oct 5)
- [x] **Business Review:** Product owner approval (Alex Martinez, Oct 5)
- [x] **Security Review:** Security team clearance (Jordan Lee, Oct 5)
- [x] **Operational Review:** DevOps team readiness (Sarah Chen, Oct 6)
- [x] **Final Approval:** Decision authority sign-off (Engineering Director, Oct 6)

### 10.3 Communication Plan
**Announcement:**
- [x] Engineering team notification (Slack #engineering channel, Oct 6)
- [x] Stakeholder update email (All hands distribution list, Oct 6)
- [ ] Architecture decision log update (Confluence wiki, Oct 7)
- [ ] Documentation wiki update (Internal developer portal, Oct 7)

**Training:**
- [ ] Technical team training sessions (Oct 7-8, 2-day workshop)
- [ ] Documentation and runbooks (GitHub wiki, Oct 9-10)
- [ ] Q&A sessions scheduled (Oct 11, all-hands meeting)

---

## 📋 11. Implementation Checklist

### 11.1 Pre-Implementation
- [x] All stakeholder approvals obtained (Oct 6, 2025)
- [x] Implementation plan detailed and resourced (Sprint 1-3 allocated)
- [x] Risk mitigation strategies in place (Secret migration checklist, rollback plan)
- [x] Success metrics and monitoring defined (Deployment time, MTTR, success rate)
- [x] Rollback plan documented and tested (Manual deployment runbook maintained)

### 11.2 Implementation
- [ ] Development work completed according to plan (Sprint 1: Oct 7-18)
- [ ] Testing completed (unit, integration, staging environment)
- [ ] Documentation updated (GitHub wiki, Confluence pages)
- [ ] Team training completed (Oct 7-8 workshop, Oct 11 Q&A)
- [ ] Monitoring and alerting configured (Cloud Monitoring dashboards)

### 11.3 Post-Implementation
- [ ] Success metrics validated (Nov 6 30-day review)
- [ ] Performance baselines established (Deployment time, MTTR tracking)
- [ ] Lessons learned documented (Retrospective notes in Confluence)
- [ ] Review schedule established (30-day, 90-day, 1-year reviews)
- [ ] Next steps identified (Canary deployments, performance testing)

---

**📝 ADR Status:** 🟢 Accepted (October 6, 2025)
**🔄 Next Review:** November 6, 2025 (30-day review)
**👤 Decision Owner:** Sarah Chen (DevOps Engineer)
**📞 Contact:** sarah.chen@diagnosticpro.io / Slack: @sarah.chen

> **Note:** This ADR is locked as Accepted. All changes after acceptance will trigger ADR-002 or subsequent ADRs that either supersede or extend this decision. Any deviations from this plan must be documented in Sprint retrospectives and communicated to all stakeholders.
