# Contributing to DiagnosticPro

Thank you for your interest in contributing to DiagnosticPro! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Search existing issues before creating new ones
- Provide clear reproduction steps for bugs
- Include environment details (OS, browser, etc.)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/DiagnosticPro.git
   cd DiagnosticPro
   ```

2. **Frontend Setup**
   ```bash
   cd 02-src/frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd 02-src/backend/services/backend
   npm install
   ```

4. **Firebase Functions**
   ```bash
   cd functions
   npm install
   npm run build
   ```

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development Guidelines**
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass locally

3. **Testing**
   ```bash
   # Frontend tests
   cd 02-src/frontend && npm test

   # PDF generator verification
   cd 02-src/backend/services/backend && scripts/verify_pdf_generator.sh
   ```

4. **Commit Messages**
   - Use conventional commit format: `type(scope): description`
   - Examples:
     - `feat(pdf): add emoji headers to diagnostic sections`
     - `fix(auth): resolve Firebase authentication issue`
     - `docs(readme): update installation instructions`

### Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation if needed
   - Verify no linting errors
   - Test the changes locally

2. **Creating the PR**
   - Use a descriptive title
   - Fill out the PR template completely
   - Link related issues using `Closes #123`
   - Request review from @jeremylongshore

3. **Review Process**
   - Address review feedback promptly
   - Keep discussions focused and professional
   - Be open to suggestions and changes

## Project Structure

```
DiagnosticPro/
├── 01-docs/              # Documentation
├── 02-src/               # Source code
│   ├── frontend/         # React/TypeScript frontend
│   └── backend/          # Node.js backend services
├── 05-scripts/           # Automation scripts
├── 06-infrastructure/    # Infrastructure as code
├── 08-features/          # Feature documentation
├── functions/            # Firebase Cloud Functions
└── deployment-docs/     # Deployment documentation
```

## Development Standards

### Frontend (React/TypeScript)
- Use TypeScript for all new code
- Follow React best practices
- Use shadcn/ui components
- Test with Jest and React Testing Library

### Backend (Node.js)
- Use ES6+ features
- Implement proper error handling
- Add JSDoc comments for functions
- Follow RESTful API conventions

### PDF Generation
- Test with verification script
- Ensure all 14 sections are implemented
- Verify fonts and styling work correctly
- Test with sample data

### Firebase Functions
- Use TypeScript
- Implement proper error handling
- Log important events
- Follow Firebase best practices

## Getting Help

- **Documentation**: Check the `/01-docs/` directory
- **Issues**: Search existing GitHub issues
- **Contact**: Create a GitHub issue for questions

## Recognition

Contributors will be acknowledged in:
- GitHub contributor list
- Release notes for significant contributions
- Special thanks in documentation

## Release Process

1. Features are developed on feature branches
2. Pull requests are reviewed and merged to main
3. Releases are created with semantic versioning
4. Deployment follows the established pipeline

---

**Thank you for contributing to DiagnosticPro!**

For questions about contributing, please create a GitHub issue or contact the maintainers.