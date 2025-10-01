# Security Policy

## Reporting Security Vulnerabilities

**DiagnosticPro** takes security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report
- **Email**: security@diagnosticpro.io
- **Response Time**: Within 24 hours
- **Confidentiality**: We will keep your report confidential until the issue is resolved

### Please DO NOT:
- Create public GitHub issues for security vulnerabilities
- Share vulnerabilities on social media or forums
- Attempt to access data that doesn't belong to you

### What to Include
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any proof-of-concept code (if applicable)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes            |
| 1.0.x   | ✅ Yes            |
| < 1.0   | ❌ No             |

## Security Measures

### Data Protection
- Customer diagnostic data encrypted in transit and at rest
- Firestore security rules enforce access controls
- Google Cloud Secret Manager for API keys
- Vertex AI for secure AI processing

### Infrastructure Security
- Firebase Hosting with HTTPS enforcement
- Cloud Functions with IAM authentication
- API Gateway with request validation
- Branch protection on main repository

### Third-Party Dependencies
- Regular security audits of npm packages
- Automated vulnerability scanning
- Prompt updates for security patches

## Responsible Disclosure

We follow responsible disclosure practices:
1. **Initial Response**: Acknowledgment within 24 hours
2. **Investigation**: Assessment within 72 hours
3. **Resolution**: Fix deployed based on severity
4. **Recognition**: Public acknowledgment (with permission)

## Contact

For security concerns, contact:
- **Primary**: security@diagnosticpro.io
- **Backup**: jeremy@intentsolutions.io

---

**Last Updated**: September 30, 2025
**Version**: 1.0