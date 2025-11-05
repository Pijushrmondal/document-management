# Document Management System API Documentation

Welcome to the Document Management System API! This guide will help you integrate with our backend services and build amazing applications on top of it.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Documents](#documents-endpoints)
  - [Tags & Folders](#tags--folders-endpoints)
  - [Actions](#actions-endpoints)
  - [Tasks](#tasks-endpoints)
  - [Audit Logs](#audit-logs-endpoints)
  - [Metrics](#metrics-endpoints)
  - [Webhooks](#webhooks-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting & Best Practices](#rate-limiting--best-practices)
- [Examples](#examples)

---

## Getting Started

### Base URL

All API endpoints are prefixed with `/v1`. The base URL depends on your environment:

- **Development**: `http://localhost:3000`
- **Production**: Your production URL (check with your team lead)

### Swagger Documentation

For interactive API exploration, visit the Swagger UI at:
```
http://localhost:3000/api-docs
```

This is super helpful when you're figuring out the exact request/response formats. Swagger shows you all the schemas and lets you test endpoints right in the browser.

### Content Type

All requests should use:
- **JSON**: `Content-Type: application/json`
- **File Uploads**: `Content-Type: multipart/form-data`

All responses are returned as JSON.

---

## Authentication

Most endpoints require authentication. The system uses JWT (JSON Web Tokens) with Bearer token authentication.

### How It Works

1. **Login** to get your access token
2. **Include the token** in every request using the `Authorization` header
3. **Token expires** after 24 hours (default) - you'll need to log in again

### Authentication Header Format

```http
Authorization: Bearer <your_access_token>
```

**Example:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles

The system supports four user roles with different permission levels:

- **`user`** - Regular users (default role)
- **`support`** - Support team members (read-only access to all data)
- **`moderator`** - Moderators (can view all data but limited write access)
- **`admin`** - Administrators (full access to everything)

**Important**: When you log in, you can specify which role you want to use. This is useful for testing different permission levels during development.

---

## API Endpoints

### Authentication Endpoints

#### Login

Get your access token to authenticate with the API.

**Endpoint:** `POST /v1/auth/login`

**Public:** Yes (no authentication required)

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "user"
}
```

**Parameters:**
- `email` (required, string) - Your email address
- `role` (optional, enum) - Desired role: `user`, `support`, `moderator`, or `admin`. Defaults to `user` if not provided.

**Success Response (200):**
```json
{
  "token_type": "Bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Tips:**
- Save the `access_token` - you'll need it for all subsequent requests
- The token is valid for 24 hours by default
- If you get a 401 Unauthorized error, your token probably expired - log in again

---

### Users Endpoints

#### Get Current User

Retrieve information about the currently authenticated user.

**Endpoint:** `GET /v1/users/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Use Cases:**
- Check if your token is still valid
- Get your user ID for other API calls
- Display user information in your app

---

### Documents Endpoints

The documents module is the heart of the system. You can upload, search, download, and manage documents here.

#### Upload Document

Upload a new document to the system. Documents are automatically organized by tags and folders.

**Endpoint:** `POST /v1/docs`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request:**
- `file` (required, file) - The document file to upload
- `primaryTag` (required, string, max 100 chars) - Main tag/category for the document
- `secondaryTags` (optional, array of strings) - Additional tags for better organization

**File Size Limit:** 10MB (configurable)

**Success Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "filename": "invoice-2024.pdf",
  "originalName": "invoice-2024.pdf",
  "mimeType": "application/pdf",
  "size": 245678,
  "primaryTag": "invoices",
  "secondaryTags": ["2024", "january"],
  "folder": "invoices",
  "uploadedBy": "507f1f77bcf86cd799439011",
  "uploadedAt": "2024-01-15T10:30:00.000Z",
  "filePath": "/uploads/invoices/invoice-2024.pdf"
}
```

**Tips:**
- The `primaryTag` automatically creates/assigns to a folder
- Use `secondaryTags` for additional categorization (e.g., dates, departments, projects)
- The system automatically detects the file type from the uploaded file
- Regular users can only see their own documents, while admins can see all documents

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/v1/docs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@invoice.pdf" \
  -F "primaryTag=invoices" \
  -F "secondaryTags[]=2024" \
  -F "secondaryTags[]=january"
```

#### List Documents

Get a paginated list of documents. The results depend on your role:
- **Users**: See only their own documents
- **Support/Moderator**: See all documents
- **Admin**: See all documents, or filter by specific user with `userId` parameter

**Endpoint:** `GET /v1/docs`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)
- `userId` (optional, string) - **Admin only** - Filter documents by specific user ID

**Success Response (200):**
```json
{
  "documents": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "invoice-2024.pdf",
      "originalName": "invoice-2024.pdf",
      "mimeType": "application/pdf",
      "size": 245678,
      "primaryTag": "invoices",
      "secondaryTags": ["2024", "january"],
      "folder": "invoices",
      "uploadedBy": "507f1f77bcf86cd799439011",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

**Example:**
```bash
# Regular user - sees only own documents
GET /v1/docs?page=1&limit=20

# Admin - sees all documents
GET /v1/docs?page=1&limit=20

# Admin - sees specific user's documents
GET /v1/docs?page=1&limit=20&userId=507f1f77bcf86cd799439011
```

#### Search Documents

Search documents using keywords, tags, or other criteria. This is more powerful than the list endpoint for finding specific documents.

**Endpoint:** `POST /v1/docs/search`

**Authentication:** Required

**Request Body:**
```json
{
  "query": "invoice",
  "tags": ["invoices", "2024"],
  "folder": "invoices",
  "mimeType": "application/pdf"
}
```

**Parameters:**
- `query` (optional, string) - Search term to match against filename/content
- `tags` (optional, array of strings) - Filter by tags
- `folder` (optional, string) - Filter by folder name
- `mimeType` (optional, string) - Filter by file type (e.g., "application/pdf")

**Success Response (200):**
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "invoice-2024.pdf",
      "primaryTag": "invoices",
      "folder": "invoices"
    }
  ],
  "total": 1
}
```

#### Get Document by ID

Retrieve details of a specific document.

**Endpoint:** `GET /v1/docs/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Document ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "filename": "invoice-2024.pdf",
  "originalName": "invoice-2024.pdf",
  "mimeType": "application/pdf",
  "size": 245678,
  "primaryTag": "invoices",
  "secondaryTags": ["2024", "january"],
  "folder": "invoices",
  "uploadedBy": "507f1f77bcf86cd799439011",
  "uploadedAt": "2024-01-15T10:30:00.000Z"
}
```

**Permissions:**
- Users can only access their own documents
- Support/Moderator/Admin can access any document

#### Download Document

Download the actual file content of a document.

**Endpoint:** `GET /v1/docs/:id/download`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Document ID

**Success Response (200):**
- Content-Type: Based on the document's mimeType
- Content-Disposition: `attachment; filename="original-filename.pdf"`
- Body: Binary file content

**Example:**
```bash
curl -X GET http://localhost:3000/v1/docs/507f1f77bcf86cd799439011/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

#### Delete Document

Delete a document from the system. This is permanent and cannot be undone.

**Endpoint:** `DELETE /v1/docs/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Document ID

**Success Response (200):**
```json
{
  "message": "Document deleted successfully"
}
```

**Permissions:**
- Users can only delete their own documents
- Admins can delete any document

**Warning:** This action is irreversible. The file is permanently removed from the server.

---

### Tags & Folders Endpoints

Tags help organize your documents, and folders are automatically created based on primary tags. This section covers managing both.

#### Create Tag

Create a new tag for organizing documents.

**Endpoint:** `POST /v1/tags`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "invoices",
  "color": "#FF5733"
}
```

**Parameters:**
- `name` (required, string) - Tag name (will also be used as folder name)
- `color` (optional, string) - Hex color code for UI display

**Success Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "invoices",
  "color": "#FF5733",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Tips:**
- Tag names are case-insensitive
- Creating a tag automatically creates a corresponding folder
- Tags are user-specific (each user has their own tags)

#### Get All Tags

Retrieve all tags created by the current user.

**Endpoint:** `GET /v1/tags`

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "invoices",
    "color": "#FF5733",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Get Tag by ID

Get details of a specific tag.

**Endpoint:** `GET /v1/tags/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Tag ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "invoices",
  "color": "#FF5733",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Delete Tag

Delete a tag. This won't delete the documents, but they'll lose the tag association.

**Endpoint:** `DELETE /v1/tags/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Tag ID

**Success Response (200):**
```json
{
  "message": "Tag deleted successfully"
}
```

**Permissions:**
- Users can only delete their own tags
- Admins can delete any tag

#### Get Folders

Get all folders (which are automatically created from primary tags). Folders represent collections of documents grouped by their primary tag.

**Endpoint:** `GET /v1/folders`

**Authentication:** Required

**Query Parameters:**
- `userId` (optional, string) - **Admin only** - Filter folders by specific user ID

**Success Response (200):**
```json
[
  {
    "name": "invoices",
    "documentCount": 15,
    "totalSize": 5242880
  },
  {
    "name": "contracts",
    "documentCount": 8,
    "totalSize": 2097152
  }
]
```

**Tips:**
- Folders are automatically created when you upload a document with a primary tag
- Each user sees their own folders by default
- Admins can view any user's folders using the `userId` parameter

#### Get Documents by Folder

Get all documents in a specific folder with pagination.

**Endpoint:** `GET /v1/folders/:name/docs`

**Authentication:** Required

**Parameters:**
- `name` (path parameter, required) - Folder name (same as primary tag name)

**Query Parameters:**
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "documents": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "invoice-2024.pdf",
      "primaryTag": "invoices",
      "folder": "invoices"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 1
}
```

---

### Actions Endpoints

Actions allow you to perform operations on documents using AI-powered features. This is where the magic happens for document processing and analysis.

#### Run Action

Execute an AI-powered action on a set of documents. This is useful for bulk operations like extracting data, summarizing, or transforming documents.

**Endpoint:** `POST /v1/actions/run`

**Authentication:** Required

**Request Body:**
```json
{
  "scope": {
    "type": "folder",
    "name": "invoices"
  },
  "messages": [
    {
      "role": "user",
      "content": "Extract all invoice numbers and amounts"
    }
  ],
  "actions": ["extract", "summarize"]
}
```

**Parameters:**
- `scope` (required, object) - Defines which documents to act upon
  - `type` (required, enum) - Either `"folder"` or `"files"`
  - `name` (required if type is "folder", string) - Folder name
  - `ids` (required if type is "files", array of strings) - Array of document IDs
- `messages` (required, array) - Conversation messages for the AI
  - `role` (required, string) - Message role (e.g., "user", "assistant")
  - `content` (required, string) - Message content
- `actions` (required, array of strings) - List of actions to perform

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "scope": {
    "type": "folder",
    "name": "invoices"
  },
  "result": {
    "extractedData": [...],
    "summary": "..."
  },
  "creditsUsed": 5,
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:30:05.000Z"
}
```

**Tips:**
- Actions consume credits (tracked per user)
- You can target a whole folder or specific files
- The AI processes your messages and performs the requested actions
- Large operations may take time - check the status by retrieving the action

#### Get Action by ID

Retrieve details of a specific action execution.

**Endpoint:** `GET /v1/actions/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Action ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "scope": {
    "type": "folder",
    "name": "invoices"
  },
  "result": {...},
  "creditsUsed": 5,
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Get Action History

Get all actions executed by the current user.

**Endpoint:** `GET /v1/actions`

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "status": "completed",
    "scope": {
      "type": "folder",
      "name": "invoices"
    },
    "creditsUsed": 5,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Permissions:**
- Users see only their own actions
- Admins can see all actions (via metrics endpoints)

#### Get Monthly Usage

Get action usage statistics for a specific month.

**Endpoint:** `GET /v1/actions/usage/month`

**Authentication:** Required

**Query Parameters:**
- `year` (optional, number) - Year (defaults to current year)
- `month` (optional, number) - Month 1-12 (defaults to current month)

**Success Response (200):**
```json
{
  "month": "2024-01",
  "totalCredits": 150,
  "actionCount": 30,
  "averageCreditsPerAction": 5
}
```

#### Get All-Time Usage

Get total usage statistics across all time.

**Endpoint:** `GET /v1/actions/usage/all`

**Authentication:** Required

**Success Response (200):**
```json
{
  "totalCredits": 1250,
  "monthlyBreakdown": [
    {
      "month": "2024-01",
      "credits": 150
    },
    {
      "month": "2023-12",
      "credits": 200
    }
  ]
}
```

---

### Tasks Endpoints

Tasks help you manage document-related workflows and reminders. Think of them as to-dos for your documents.

#### Create Task

Create a new task related to documents or workflows.

**Endpoint:** `POST /v1/tasks`

**Authentication:** Required

**Request Body:**
```json
{
  "source": "document-123",
  "type": "review",
  "channel": "email",
  "target": "reviewer@example.com",
  "title": "Review Q4 Invoice",
  "description": "Please review the Q4 invoice for accuracy",
  "metadata": {
    "documentId": "507f1f77bcf86cd799439011",
    "priority": "high"
  },
  "dueDate": "2024-01-20T10:00:00.000Z"
}
```

**Parameters:**
- `source` (required, string, max 100 chars) - Source identifier (document ID, etc.)
- `type` (required, enum) - Task type: `review`, `approval`, `notification`, etc.
- `channel` (required, enum) - Communication channel: `email`, `sms`, `webhook`, etc.
- `target` (required, string, max 500 chars) - Target recipient (email, phone, URL, etc.)
- `title` (optional, string, max 200 chars) - Task title
- `description` (optional, string, max 1000 chars) - Task description
- `metadata` (optional, object) - Additional metadata
- `dueDate` (optional, ISO date string) - Task due date

**Success Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "source": "document-123",
  "type": "review",
  "channel": "email",
  "target": "reviewer@example.com",
  "title": "Review Q4 Invoice",
  "status": "pending",
  "dueDate": "2024-01-20T10:00:00.000Z",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Get Tasks

Get all tasks with filtering and pagination.

**Endpoint:** `GET /v1/tasks`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)
- `status` (optional, enum) - Filter by status: `pending`, `in_progress`, `completed`, `failed`, `cancelled`
- `type` (optional, enum) - Filter by task type
- `channel` (optional, enum) - Filter by channel

**Success Response (200):**
```json
{
  "tasks": [
    {
      "id": "507f1f77bcf86cd799439011",
      "source": "document-123",
      "type": "review",
      "status": "pending",
      "title": "Review Q4 Invoice",
      "dueDate": "2024-01-20T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 2
}
```

#### Get Task Statistics

Get summary statistics for your tasks.

**Endpoint:** `GET /v1/tasks/stats`

**Authentication:** Required

**Success Response (200):**
```json
{
  "total": 25,
  "pending": 5,
  "inProgress": 3,
  "completed": 15,
  "failed": 2
}
```

#### Get Today's Tasks

Get all tasks due today.

**Endpoint:** `GET /v1/tasks/today`

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Review Q4 Invoice",
    "status": "pending",
    "dueDate": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Get Overdue Tasks

Get all tasks that are past their due date and not completed.

**Endpoint:** `GET /v1/tasks/overdue`

**Authentication:** Required

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Review Q4 Invoice",
    "status": "pending",
    "dueDate": "2024-01-10T10:00:00.000Z"
  }
]
```

#### Get Task by ID

Retrieve details of a specific task.

**Endpoint:** `GET /v1/tasks/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "source": "document-123",
  "type": "review",
  "channel": "email",
  "target": "reviewer@example.com",
  "title": "Review Q4 Invoice",
  "description": "Please review the Q4 invoice for accuracy",
  "status": "pending",
  "dueDate": "2024-01-20T10:00:00.000Z",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Update Task

Update task details.

**Endpoint:** `PATCH /v1/tasks/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "dueDate": "2024-01-25T10:00:00.000Z",
  "metadata": {
    "priority": "urgent"
  }
}
```

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Updated Title",
  "status": "pending",
  ...
}
```

#### Complete Task

Mark a task as completed.

**Endpoint:** `PATCH /v1/tasks/:id/complete`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Request Body:**
```json
{
  "notes": "Task completed successfully"
}
```

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "notes": "Task completed successfully",
  "completedAt": "2024-01-15T11:00:00.000Z"
}
```

#### Fail Task

Mark a task as failed.

**Endpoint:** `PATCH /v1/tasks/:id/fail`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Request Body:**
```json
{
  "notes": "Failed due to timeout"
}
```

#### Cancel Task

Cancel a task.

**Endpoint:** `PATCH /v1/tasks/:id/cancel`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Request Body:**
```json
{
  "notes": "Cancelled by user"
}
```

#### Delete Task

Delete a task permanently.

**Endpoint:** `DELETE /v1/tasks/:id`

**Authentication:** Required

**Parameters:**
- `id` (path parameter, required) - Task ID

**Success Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

### Audit Logs Endpoints

Audit logs track all important actions in the system. This is crucial for compliance and debugging.

#### Query Audit Logs

**Admin only** - Query system-wide audit logs with advanced filtering.

**Endpoint:** `GET /v1/audit`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `userId` (optional, string) - Filter by user ID
- `action` (optional, string) - Filter by action type
- `resource` (optional, string) - Filter by resource type
- `from` (optional, ISO date string) - Start date
- `to` (optional, ISO date string) - End date
- `limit` (optional, number) - Results limit (default: 50)
- `offset` (optional, number) - Results offset (default: 0)

**Success Response (200):**
```json
{
  "logs": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "action": "document.upload",
      "resource": "document",
      "resourceId": "507f1f77bcf86cd799439013",
      "details": {...},
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### Get My Audit Trail

Get audit logs for the current user only.

**Endpoint:** `GET /v1/audit/me`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "logs": [
    {
      "id": "507f1f77bcf86cd799439011",
      "action": "document.upload",
      "resource": "document",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 2
}
```

#### Get User Audit Trail

**Admin/Support only** - Get audit logs for a specific user.

**Endpoint:** `GET /v1/audit/user/:userId`

**Authentication:** Required (Admin or Support role)

**Parameters:**
- `userId` (path parameter, required) - User ID

**Query Parameters:**
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)
- `from` (optional, ISO date string) - Start date
- `to` (optional, ISO date string) - End date

**Success Response (200):**
```json
{
  "logs": [...],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

#### Get Audit Log by ID

Get details of a specific audit log entry.

**Endpoint:** `GET /v1/audit/:logId`

**Authentication:** Required

**Parameters:**
- `logId` (path parameter, required) - Audit log ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "action": "document.upload",
  "resource": "document",
  "resourceId": "507f1f77bcf86cd799439013",
  "details": {
    "filename": "invoice.pdf",
    "size": 245678
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Metrics Endpoints

Metrics provide insights into system usage, performance, and statistics. These are essential for monitoring and analytics.

#### Get System Metrics

**Admin/Support only** - Get system-wide metrics and statistics.

**Endpoint:** `GET /v1/metrics`

**Authentication:** Required (Admin or Support role)

**Success Response (200):**
```json
{
  "totalUsers": 150,
  "totalDocuments": 1250,
  "totalStorageUsed": 524288000,
  "totalActions": 500,
  "totalTasks": 300
}
```

#### Get My Metrics

Get metrics for the current user.

**Endpoint:** `GET /v1/metrics/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "documentCount": 25,
  "storageUsed": 10485760,
  "actionsCount": 15,
  "tasksCount": 8,
  "tagsCount": 5
}
```

#### Get Document Metrics

**Admin/Support only** - Get document-related metrics.

**Endpoint:** `GET /v1/metrics/documents`

**Authentication:** Required (Admin or Support role)

**Query Parameters:**
- `userId` (optional, string) - Filter metrics for specific user

**Success Response (200):**
```json
{
  "totalDocuments": 1250,
  "totalStorageUsed": 524288000,
  "averageFileSize": 419430,
  "documentsByType": {
    "application/pdf": 800,
    "image/jpeg": 300,
    "application/msword": 150
  },
  "documentsByFolder": {
    "invoices": 400,
    "contracts": 300,
    "reports": 550
  }
}
```

#### Get Action Metrics

**Admin/Support only** - Get action-related metrics.

**Endpoint:** `GET /v1/metrics/actions`

**Authentication:** Required (Admin or Support role)

**Query Parameters:**
- `userId` (optional, string) - Filter metrics for specific user

**Success Response (200):**
```json
{
  "totalActions": 500,
  "totalCreditsUsed": 2500,
  "averageCreditsPerAction": 5,
  "actionsByStatus": {
    "completed": 450,
    "failed": 30,
    "pending": 20
  },
  "actionsByType": {
    "extract": 200,
    "summarize": 150,
    "transform": 150
  }
}
```

#### Get Task Metrics

**Admin/Support only** - Get task-related metrics.

**Endpoint:** `GET /v1/metrics/tasks`

**Authentication:** Required (Admin or Support role)

**Query Parameters:**
- `userId` (optional, string) - Filter metrics for specific user

**Success Response (200):**
```json
{
  "totalTasks": 300,
  "tasksByStatus": {
    "pending": 50,
    "inProgress": 30,
    "completed": 200,
    "failed": 20
  },
  "tasksByType": {
    "review": 150,
    "approval": 100,
    "notification": 50
  },
  "overdueTasks": 10
}
```

#### Get Webhook Metrics

**Admin only** - Get webhook-related metrics.

**Endpoint:** `GET /v1/metrics/webhooks`

**Authentication:** Required (Admin role)

**Success Response (200):**
```json
{
  "totalEvents": 1000,
  "eventsByStatus": {
    "success": 950,
    "failed": 50
  },
  "eventsByType": {
    "ocr": 800,
    "notification": 200
  }
}
```

#### Get Detailed Metrics

**Admin only** - Get comprehensive metrics combining all aspects.

**Endpoint:** `GET /v1/metrics/detailed`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `userId` (optional, string) - Filter metrics for specific user

**Success Response (200):**
```json
{
  "system": {
    "totalUsers": 150,
    "totalDocuments": 1250
  },
  "documents": {
    "totalDocuments": 1250,
    "totalStorageUsed": 524288000
  },
  "actions": {
    "totalActions": 500,
    "totalCreditsUsed": 2500
  },
  "tasks": {
    "totalTasks": 300,
    "overdueTasks": 10
  },
  "webhooks": {
    "totalEvents": 1000
  }
}
```

---

### Webhooks Endpoints

Webhooks allow external systems to send events to your application. Currently, the system supports OCR webhook processing.

#### Query Webhook Events

**Admin/Support only** - Query webhook events with filtering.

**Endpoint:** `GET /v1/webhooks`

**Authentication:** Required (Admin or Support role)

**Query Parameters:**
- `type` (optional, string) - Filter by event type
- `status` (optional, string) - Filter by status: `success`, `failed`, `pending`
- `page` (optional, number) - Page number (default: 1)
- `limit` (optional, number) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "events": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "ocr",
      "status": "success",
      "payload": {...},
      "receivedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

#### Get Webhook Event by ID

**Admin/Support only** - Get details of a specific webhook event.

**Endpoint:** `GET /v1/webhooks/:id`

**Authentication:** Required (Admin or Support role)

**Parameters:**
- `id` (path parameter, required) - Webhook event ID

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "type": "ocr",
  "status": "success",
  "payload": {
    "documentId": "507f1f77bcf86cd799439012",
    "extractedText": "..."
  },
  "receivedAt": "2024-01-15T10:30:00.000Z",
  "processedAt": "2024-01-15T10:30:05.000Z"
}
```

#### Get Webhook Statistics

**Admin only** - Get webhook statistics and summary.

**Endpoint:** `GET /v1/webhooks/stats/summary`

**Authentication:** Required (Admin role)

**Success Response (200):**
```json
{
  "totalEvents": 1000,
  "successRate": 0.95,
  "eventsByType": {
    "ocr": 800,
    "notification": 200
  },
  "eventsByStatus": {
    "success": 950,
    "failed": 50
  }
}
```

---

## Error Handling

The API uses standard HTTP status codes to indicate success or failure. Here's what you need to know:

### Success Status Codes

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully

### Client Error Status Codes

- **400 Bad Request** - Invalid request format or parameters
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Authenticated but insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **422 Unprocessable Entity** - Validation failed (e.g., file too large)

### Server Error Status Codes

- **500 Internal Server Error** - Something went wrong on the server

### Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

### Common Error Scenarios

**401 Unauthorized**
- Your token is missing or expired
- **Solution**: Log in again to get a new token

**403 Forbidden**
- You don't have permission for this action
- **Solution**: Check your user role or contact an admin

**422 Unprocessable Entity**
- File upload exceeded size limit
- Validation failed for request data
- **Solution**: Check the file size (max 10MB) or validate your request data

**404 Not Found**
- Document/task/resource doesn't exist
- Or you don't have access to it
- **Solution**: Verify the ID and your permissions

---

## Rate Limiting & Best Practices

### Rate Limiting

Currently, there are no strict rate limits enforced, but please be considerate:
- Don't hammer the API with rapid requests
- Implement exponential backoff for retries
- Cache responses when appropriate

### Best Practices

1. **Always Include the Authorization Header**
   ```http
   Authorization: Bearer YOUR_TOKEN
   ```

2. **Handle Token Expiration**
   - Tokens expire after 24 hours
   - Implement token refresh logic in your app
   - Catch 401 errors and prompt re-authentication

3. **Use Pagination**
   - Always specify `page` and `limit` for list endpoints
   - Don't request more data than you need
   - Default limit is 20 items per page

4. **Validate File Uploads**
   - Check file size before uploading (max 10MB)
   - Verify file type is supported
   - Handle upload errors gracefully

5. **Error Handling**
   - Always check status codes
   - Parse error messages for user feedback
   - Log errors for debugging

6. **Use Appropriate Endpoints**
   - Use search when you need to find specific documents
   - Use list when you need paginated results
   - Use folders for organizing documents

7. **Monitor Your Usage**
   - Check action usage regularly
   - Keep track of storage usage
   - Review audit logs for security

---

## Examples

### Complete Workflow Example

Here's a complete example of uploading a document, searching for it, and then downloading it:

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    role: 'user'
  })
});

const { access_token } = await loginResponse.json();

// 2. Upload Document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('primaryTag', 'invoices');
formData.append('secondaryTags[]', '2024');
formData.append('secondaryTags[]', 'january');

const uploadResponse = await fetch('http://localhost:3000/v1/docs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`
  },
  body: formData
});

const document = await uploadResponse.json();

// 3. Search for Documents
const searchResponse = await fetch('http://localhost:3000/v1/docs/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'invoice',
    tags: ['invoices', '2024']
  })
});

const { results } = await searchResponse.json();

// 4. Download Document
const downloadResponse = await fetch(
  `http://localhost:3000/v1/docs/${document.id}/download`,
  {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }
);

const blob = await downloadResponse.blob();
// Save or display the blob
```

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"user"}'

# Upload Document (save token from login first)
export TOKEN="your_token_here"

curl -X POST http://localhost:3000/v1/docs \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invoice.pdf" \
  -F "primaryTag=invoices" \
  -F "secondaryTags[]=2024"

# List Documents
curl -X GET "http://localhost:3000/v1/docs?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Download Document
curl -X GET http://localhost:3000/v1/docs/DOCUMENT_ID/download \
  -H "Authorization: Bearer $TOKEN" \
  --output downloaded-file.pdf
```

---

## Support & Resources

### Getting Help

If you run into issues:

1. **Check the Swagger Docs** - `http://localhost:3000/api-docs`
2. **Review Error Messages** - They usually contain helpful information
3. **Check Your Permissions** - Make sure your role has the required access
4. **Contact Support** - Reach out to your team lead or admin

### Additional Resources

- **Swagger UI**: Interactive API documentation at `/api-docs`
- **RBAC Documentation**: Check `RBAC_IMPLEMENTATION.md` for role-based access details
- **GitHub Repository**: Check the repo for latest updates and issues

---

## Changelog

### Version 1.0
- Initial API release
- Authentication with JWT
- Document management (upload, search, download, delete)
- Tags and folders
- Actions for AI-powered document processing
- Tasks for workflow management
- Audit logs
- Metrics and analytics
- Webhook support

---

**Last Updated:** January 2024

**API Version:** v1

**Maintained by:** Document Management Team

