# Source Code

This directory contains all application source code.

## Structure

- `frontend/` - React application (Firebase Hosting)
- `backend/` - Node.js Express API (Cloud Run)
  - `services/ai/` - Vertex AI integration
  - `services/payment/` - Stripe integration
  - `services/storage/` - Cloud Storage integration
  - `routes/` - API route handlers
  - `middleware/` - Express middleware
  - `utils/` - Utility functions
- `shared/` - Code shared between frontend and backend

## Target Deployment

- Frontend → Firebase Hosting
- Backend → Cloud Run
