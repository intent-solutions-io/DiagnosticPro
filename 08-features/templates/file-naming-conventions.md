---
**Created**: 2025-09-30
**Updated**: 2025-09-30
**Status**: Reference Documentation
---

# File Naming Conventions Reference Guide

## Table of Contents

1. [Overview & Principles](#overview--principles)
2. [Naming Convention Types](#naming-convention-types)
3. [Platform-Specific Requirements](#platform-specific-requirements)
4. [Use Case Decision Matrix](#use-case-decision-matrix)
5. [Project Type Guidelines](#project-type-guidelines)
6. [Common Mistakes & Solutions](#common-mistakes--solutions)
7. [Enforcement & Automation](#enforcement--automation)
8. [Best Practices Summary](#best-practices-summary)

## Overview & Principles

### Core Principles
- **Consistency**: Use the same convention within the same context
- **Clarity**: Names should be immediately understandable
- **Compatibility**: Follow platform-specific requirements
- **Searchability**: Enable efficient file discovery
- **Future-proofing**: Names should remain valid as projects grow

### Universal Rules
1. **Never use spaces** in file names
2. **Avoid special characters** except approved separators
3. **Keep names descriptive** but concise
4. **Use consistent abbreviations** within projects
5. **Follow project conventions** before personal preferences

## Naming Convention Types

### 1. kebab-case (Hyphen-Separated)

**Format**: `word-word-word`

**Characteristics**:
- All lowercase
- Words separated by hyphens (-)
- Most URL-friendly
- Easy to read

**Best For**:
- Web URLs
- CSS files
- HTML files
- Documentation
- Repository names
- Branch names

**Examples**:
```
user-authentication.html
api-response-handler.css
feature-user-profile.js
auth-service-config.json
```

### 2. camelCase (Lower Camel Case)

**Format**: `wordWordWord`

**Characteristics**:
- First word lowercase
- Subsequent words capitalized
- No separators
- Compact format

**Best For**:
- JavaScript variables
- JavaScript functions
- JSON property names
- Database field names (modern)
- JavaScript/TypeScript files

**Examples**:
```
userAuthentication.js
apiResponseHandler.ts
getUserProfile.js
authServiceConfig.json
```

### 3. PascalCase (Upper Camel Case)

**Format**: `WordWordWord`

**Characteristics**:
- All words capitalized
- No separators
- Used for types/classes
- Formal naming

**Best For**:
- Class names
- Component files (React)
- Type definitions
- Interface names
- Constructor functions

**Examples**:
```
UserAuthentication.tsx
ApiResponseHandler.ts
UserProfileComponent.vue
AuthServiceInterface.ts
```

### 4. snake_case (Underscore-Separated)

**Format**: `word_word_word`

**Characteristics**:
- All lowercase
- Words separated by underscores (_)
- Traditional Unix/Linux style
- Highly readable

**Best For**:
- Python files
- Database tables/columns
- Configuration files
- Environment variables (lowercase)
- Shell scripts

**Examples**:
```
user_authentication.py
api_response_handler.py
user_profile_service.py
database_config.ini
```

### 5. SCREAMING_SNAKE_CASE (Constant Case)

**Format**: `WORD_WORD_WORD`

**Characteristics**:
- All uppercase
- Words separated by underscores (_)
- Indicates constants/globals
- Highly visible

**Best For**:
- Environment variables
- Constants files
- Configuration constants
- Global settings
- API keys/secrets

**Examples**:
```
DATABASE_CONNECTION_STRING
API_BASE_URL
MAX_FILE_SIZE
STRIPE_SECRET_KEY
```

### 6. CAPS-WITH-DASHES (Screaming Kebab Case)

**Format**: `WORD-WORD-WORD`

**Characteristics**:
- All uppercase
- Words separated by hyphens (-)
- Less common
- Platform-specific usage

**Best For**:
- Docker environment files
- Some CI/CD configurations
- Legacy system compatibility
- Specific platform requirements

**Examples**:
```
DATABASE-CONFIG
API-ENDPOINTS
BUILD-SETTINGS
```

## Platform-Specific Requirements

### Web Development

| File Type | Convention | Example |
|-----------|------------|---------|
| HTML | kebab-case | `user-profile.html` |
| CSS | kebab-case | `main-navigation.css` |
| JavaScript | camelCase | `userService.js` |
| React Components | PascalCase | `UserProfile.tsx` |
| Vue Components | PascalCase | `UserProfile.vue` |

### Backend Development

| Language | Convention | Example |
|----------|------------|---------|
| Python | snake_case | `user_service.py` |
| Java | PascalCase | `UserService.java` |
| C# | PascalCase | `UserService.cs` |
| Go | camelCase | `userService.go` |
| PHP | camelCase/snake_case | `userService.php` |

### Database Systems

| System | Convention | Example |
|--------|------------|---------|
| PostgreSQL | snake_case | `user_profiles` |
| MySQL | snake_case | `user_profiles` |
| MongoDB | camelCase | `userProfiles` |
| BigQuery | snake_case | `user_analytics_data` |

### Configuration Files

| Type | Convention | Example |
|------|------------|---------|
| Environment Variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Config Files | kebab-case | `app-config.yaml` |
| Docker | kebab-case | `docker-compose.yml` |
| Package Files | kebab-case | `package.json` |

## Use Case Decision Matrix

### Quick Decision Tree

```
1. Is it a URL or web-accessible file?
   └── YES: Use kebab-case

2. Is it a class, component, or type definition?
   └── YES: Use PascalCase

3. Is it a constant or environment variable?
   └── YES: Use SCREAMING_SNAKE_CASE

4. Is it Python code?
   └── YES: Use snake_case

5. Is it JavaScript/TypeScript (non-component)?
   └── YES: Use camelCase

6. When in doubt: Follow project conventions
```

### Detailed Decision Matrix

| Context | Primary | Alternative | Notes |
|---------|---------|-------------|-------|
| **Web URLs** | kebab-case | - | SEO-friendly, standards compliant |
| **React Components** | PascalCase | - | JSX requirement |
| **JavaScript Functions** | camelCase | - | Language convention |
| **Python Modules** | snake_case | - | PEP 8 standard |
| **Database Tables** | snake_case | camelCase (NoSQL) | SQL standard vs modern NoSQL |
| **CSS Classes** | kebab-case | - | CSS standard |
| **Environment Variables** | SCREAMING_SNAKE_CASE | - | Universal standard |
| **Documentation** | kebab-case | snake_case | Web-friendly preferred |

## Project Type Guidelines

### React/TypeScript Project

```
src/
├── components/
│   ├── UserProfile.tsx          # PascalCase (components)
│   ├── UserProfile.test.tsx     # PascalCase + suffix
│   └── user-profile.module.css  # kebab-case (CSS)
├── hooks/
│   └── useUserData.ts           # camelCase (hooks)
├── services/
│   └── apiService.ts            # camelCase (services)
├── types/
│   └── UserTypes.ts             # PascalCase (types)
└── utils/
    └── dateFormatter.ts         # camelCase (utilities)
```

### Python/Django Project

```
project/
├── models/
│   └── user_profile.py          # snake_case
├── views/
│   └── user_views.py            # snake_case
├── services/
│   └── email_service.py         # snake_case
├── tests/
│   └── test_user_service.py     # snake_case + prefix
└── config/
    └── database_settings.py     # snake_case
```

### Documentation Project

```
docs/
├── api-reference.md             # kebab-case
├── user-guide.md               # kebab-case
├── installation-guide.md       # kebab-case
├── troubleshooting.md          # kebab-case
└── assets/
    └── user-flow-diagram.png   # kebab-case
```

### Node.js/Express API

```
src/
├── controllers/
│   └── userController.js        # camelCase
├── models/
│   └── UserModel.js            # PascalCase (classes)
├── routes/
│   └── userRoutes.js           # camelCase
├── middleware/
│   └── authMiddleware.js       # camelCase
└── config/
    └── database.config.js      # camelCase
```

## Common Mistakes & Solutions

### Mistake 1: Inconsistent Convention Within Project

**Wrong**:
```
src/
├── UserProfile.js
├── user-settings.js
├── API_Handler.js
└── data_service.js
```

**Correct**:
```
src/
├── userProfile.js
├── userSettings.js
├── apiHandler.js
└── dataService.js
```

### Mistake 2: Platform-Inappropriate Conventions

**Wrong**:
```python
# Python file using camelCase
def getUserData():
    pass

class apiHandler:
    pass
```

**Correct**:
```python
# Python file using snake_case
def get_user_data():
    pass

class ApiHandler:
    pass
```

### Mistake 3: Special Characters in File Names

**Wrong**:
```
user profile (final).js
api-handler@v2.js
data_service-new!.py
```

**Correct**:
```
user-profile-final.js
api-handler-v2.js
data_service_new.py
```

### Mistake 4: Overly Long Names

**Wrong**:
```
user-authentication-service-with-password-reset-functionality.js
```

**Correct**:
```
user-auth-service.js
password-reset-service.js
```

### Mistake 5: Non-Descriptive Names

**Wrong**:
```
utils.js
helper.py
data.json
temp.html
```

**Correct**:
```
stringUtils.js
dateHelper.py
userProfiles.json
userRegistration.html
```

## Enforcement & Automation

### ESLint Rules (JavaScript/TypeScript)

```json
{
  "rules": {
    "camelcase": ["error", { "properties": "always" }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variableLike",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

### Python/Pylint Rules

```ini
[BASIC]
# Good variable names which should always be accepted
good-names=i,j,k,ex,Run,_

# Regular expression matching correct function names
function-rgx=[a-z_][a-z0-9_]{2,30}$

# Regular expression matching correct class names
class-rgx=[A-Z_][a-zA-Z0-9]+$
```

### Git Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: filename-convention
        name: Check filename conventions
        entry: python scripts/check_filenames.py
        language: python
        always_run: true
```

### Custom Validation Script

```python
#!/usr/bin/env python3
"""
Filename convention checker
"""
import re
import sys
from pathlib import Path

CONVENTIONS = {
    '.js': r'^[a-z][a-zA-Z0-9]*\.js$',  # camelCase
    '.ts': r'^[a-z][a-zA-Z0-9]*\.ts$',  # camelCase
    '.tsx': r'^[A-Z][a-zA-Z0-9]*\.tsx$',  # PascalCase
    '.py': r'^[a-z_][a-z0-9_]*\.py$',   # snake_case
    '.html': r'^[a-z-][a-z0-9-]*\.html$',  # kebab-case
    '.css': r'^[a-z-][a-z0-9-]*\.css$',   # kebab-case
}

def validate_filename(filepath):
    """Validate filename against conventions"""
    suffix = filepath.suffix
    if suffix in CONVENTIONS:
        pattern = CONVENTIONS[suffix]
        if not re.match(pattern, filepath.name):
            return False, f"Invalid naming for {suffix}: {filepath.name}"
    return True, ""

def main():
    """Main validation function"""
    errors = []
    for file_path in Path('.').rglob('*'):
        if file_path.is_file():
            valid, error = validate_filename(file_path)
            if not valid:
                errors.append(error)

    if errors:
        print("Filename convention errors:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)

    print("All filenames follow conventions ✓")

if __name__ == "__main__":
    main()
```

### Makefile Integration

```makefile
# Makefile
check-naming:
	@echo "Checking filename conventions..."
	@python scripts/check_filenames.py

lint: check-naming
	@echo "Running linting with naming checks..."
	@eslint src/
	@pylint src/

pre-commit: lint
	@echo "Pre-commit checks passed ✓"
```

## Best Practices Summary

### Golden Rules

1. **Consistency Over Preference**: Follow project conventions, not personal preferences
2. **Platform Standards**: Respect language and platform conventions
3. **Descriptive Names**: Make file purpose clear from the name
4. **Avoid Abbreviations**: Unless they're universally understood
5. **Version Control Friendly**: Use conventions that work well with Git

### Convention Selection Hierarchy

1. **Language/Framework Standard** (highest priority)
2. **Project/Team Convention**
3. **Platform Requirements**
4. **Industry Standards**
5. **Personal Preference** (lowest priority)

### Quick Reference Card

| File Type | Convention | Example |
|-----------|------------|---------|
| React Components | PascalCase | `UserProfile.tsx` |
| JS/TS Functions | camelCase | `getUserData.js` |
| Python Files | snake_case | `user_service.py` |
| HTML/CSS | kebab-case | `user-profile.html` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Documentation | kebab-case | `installation-guide.md` |

### Automation Checklist

- [ ] ESLint/Pylint naming rules configured
- [ ] Pre-commit hooks for filename validation
- [ ] CI/CD pipeline includes naming checks
- [ ] Team documentation includes naming standards
- [ ] Custom validation scripts for project-specific rules

### Team Adoption Strategy

1. **Document Standards**: Create project-specific naming guide
2. **Automate Enforcement**: Set up linting and pre-commit hooks
3. **Lead by Example**: Ensure all new code follows conventions
4. **Refactor Gradually**: Update existing files during maintenance
5. **Train Team**: Conduct naming convention workshops

## Conclusion

Consistent file naming conventions are crucial for:
- **Developer Experience**: Faster navigation and understanding
- **Team Collaboration**: Reduced confusion and conflicts
- **Tool Integration**: Better IDE and build tool support
- **Maintenance**: Easier refactoring and debugging
- **Scaling**: Sustainable growth as projects expand

Remember: **The best convention is the one your team follows consistently.**

---

**Reference**: Based on industry standards, platform conventions, and development best practices.
**Maintained**: DiagnosticPro Platform Team
**Version**: 1.0.0