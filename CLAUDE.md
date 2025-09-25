# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node package for integrating LiblibAI Star-3 Alpha AI image generation services. The package provides nodes for text-to-image, image-to-image, and status checking operations with full ControlNet support and asynchronous task polling.

## Development Commands

```bash
# Install dependencies
npm install

# Development with watch mode
npm run dev

# Build the project
npm run build

# Build with watch mode
npm run build:watch

# Code linting
npm run lint

# Auto-fix linting issues
npm run lintfix

# Code formatting
npm run format

# Prepare for publishing (builds and lints)
npm run prepublishOnly

# Test (currently no tests specified)
npm run test
```

## Architecture

### Core Components

**Node Implementation** (`nodes/LiblibAI/LiblibAI.node.ts`):
- Main n8n node class implementing INodeType interface
- Handles three operations: text2img, img2img, checkStatus
- Extensive parameter validation and UI property definitions
- Async result handling with configurable polling

**API Client** (`utils/api-client.ts`):
- LiblibAIClient class wrapping axios with automatic HMAC-SHA1 signature authentication
- Request/response interceptors for signature generation and error handling
- Methods for text2img, img2img, status checking, and image downloading

**Task Poller** (`utils/task-poller.ts`):
- TaskPoller class for polling async generation tasks until completion
- Exponential backoff with jitter to avoid request storms
- Configurable timeout and polling intervals
- Progress callbacks and batch polling support

**Signature Generator** (`utils/signature.ts`):
- HMAC-SHA1 signature implementation for LiblibAI API authentication
- URL-safe Base64 encoding with proper character replacements
- Timestamp validation and signature verification utilities

### Key Design Patterns

**Authentication Flow**: Every API request automatically gets AccessKey, Timestamp, SignatureNonce, and Signature parameters added via axios interceptor using HMAC-SHA1 algorithm.

**Async Task Management**: Generation requests return a UUID, then TaskPoller handles the polling loop with exponential backoff until completion or timeout.

**Error Handling**: Custom LiblibAIError class with structured error information, proper n8n error wrapping in NodeOperationError.

**Parameter Validation**: Comprehensive validation for prompts (max 2000 chars), image dimensions (512-2048px), URL format validation.

### Template UUIDs
- Text-to-Image: `5d7e67009b344550bc1aa6ccbfa1d7f4`
- Image-to-Image: `07e00af4fc464c7ab55ff906f8acf1b7`

### n8n Integration Points

**Credentials**: LiblibAIApi credential type with AccessKey, SecretKey, and BaseURL fields.

**Binary Data**: Generated images are downloaded and attached as binary data with proper MIME types and filenames.

**Node Properties**: Complex conditional UI with size modes (aspect ratio vs custom), advanced settings collection, ControlNet configuration.

## Build System

Uses TypeScript compilation (`tsc`) followed by Gulp tasks for copying assets:
- Icons and static files copied to dist/nodes/
- package.json and README.md copied to dist/
- Output goes to `dist/` directory for n8n consumption