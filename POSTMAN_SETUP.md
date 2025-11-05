# Postman Collection Setup Guide

This guide will help you quickly set up and use the Document Management API Postman collection.

## Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `Document_Management_API.postman_collection.json`
4. The collection will appear in your Postman sidebar

### 2. Set Up Environment Variables

The collection uses environment variables for easy configuration:

1. In Postman, click **Environments** in the left sidebar
2. Click **+** to create a new environment
3. Name it "Document Management API"
4. Add these variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` | API base URL |
| `access_token` | (leave empty) | (auto-filled) | JWT token (auto-saved after login) |
| `user_id` | (leave empty) | (auto-filled) | User ID (auto-saved after login) |

5. Click **Save**
6. Select your environment from the dropdown in the top right corner

### 3. Run Your First Request

1. Open the **Authentication** folder
2. Click on **Login**
3. Update the request body with your email:
   ```json
   {
     "email": "your-email@example.com",
     "role": "user"
   }
   ```
4. Click **Send**

**Magic!** The token is automatically saved to the `access_token` variable. All subsequent requests will use it automatically.

### 4. Test Other Endpoints

Now you can use any endpoint in the collection. The authentication token is automatically included in all requests.

## Collection Structure

The collection is organized into folders:

- **Authentication** - Login and token management
- **Users** - User profile endpoints
- **Documents** - Document upload, search, download, delete
- **Tags & Folders** - Tag and folder management
- **Actions** - AI-powered document actions
- **Tasks** - Task management endpoints
- **Audit Logs** - Audit trail and logging
- **Metrics** - Analytics and statistics
- **Webhooks** - Webhook event management

## Features

### Automatic Token Management

The Login request automatically saves your token:
- After a successful login, the token is saved to `access_token`
- All other requests use this token automatically
- No need to manually copy/paste tokens!

### Pre-configured Requests

All requests are pre-configured with:
- Correct HTTP methods
- Proper headers
- Example request bodies
- Path and query parameters

### Environment Variables

Use variables to easily switch between environments:
- Development: `http://localhost:3000`
- Staging: `https://staging-api.example.com`
- Production: `https://api.example.com`

Just change the `base_url` variable!

## Common Workflows

### Upload a Document

1. Go to **Documents** → **Upload Document**
2. In the **Body** tab, click the file selector next to `file`
3. Choose your file
4. Set `primaryTag` (e.g., "invoices")
5. Add `secondaryTags[]` if needed
6. Click **Send**

### Search Documents

1. Go to **Documents** → **Search Documents**
2. Update the request body:
   ```json
   {
     "query": "invoice",
     "tags": ["invoices", "2024"],
     "folder": "invoices"
   }
   ```
3. Click **Send**

### Run an Action

1. Go to **Actions** → **Run Action**
2. Update the request body:
   ```json
   {
     "scope": {
       "type": "folder",
       "name": "invoices"
     },
     "messages": [
       {
         "role": "user",
         "content": "Extract all invoice numbers"
       }
     ],
     "actions": ["extract"]
   }
   ```
3. Click **Send**

## Tips

1. **Use Collections Runner** - Test multiple requests in sequence
2. **Save Responses** - Click "Save Response" to keep examples
3. **Create Tests** - Add tests to verify responses
4. **Use Variables** - Replace hardcoded IDs with variables
5. **Share Collections** - Export and share with your team

## Troubleshooting

### "401 Unauthorized" Error
- Your token expired (tokens last 24 hours)
- Solution: Run the Login request again

### "403 Forbidden" Error
- You don't have permission for this action
- Solution: Check your user role or use an admin account

### "Cannot find variable" Error
- Environment not selected
- Solution: Select your environment from the dropdown (top right)

### File Upload Not Working
- Make sure you're using `form-data` (not `raw` JSON)
- Check file size (max 10MB)
- Verify the file field is set to "File" type

## Next Steps

1. Explore all endpoints in the collection
2. Customize requests for your use case
3. Add your own tests and scripts
4. Share the collection with your team

Happy testing! 🚀

