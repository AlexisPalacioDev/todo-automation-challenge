# Todo App API Documentation

This API provides endpoints for managing todos and integrating with N8N workflows.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-vercel-app.vercel.app/api`

## Endpoints

### 1. Get Todos
**GET** `/todos?user_email={email}`

Fetch all todos for a specific user.

**Query Parameters:**
- `user_email` (required): User's email address

**Response:**
```json
{
  "todos": [
    {
      "id": 1,
      "title": "Complete project",
      "completed": false,
      "user_email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Create Todo
**POST** `/todos`

Create a new todo.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "user_email": "user@example.com",
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "todo": {
    "id": 1,
    "title": "Buy groceries",
    "completed": false,
    "user_email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Todo created successfully"
}
```

### 3. Enhance Title (AI)
**POST** `/enhance-title`

Use AI to enhance and improve a todo title.

**Request Body:**
```json
{
  "title": "gym"
}
```

**Response:**
```json
{
  "original_title": "gym",
  "enhanced_title": "🏋️‍♀️ Gym - Duración: 30-45 min",
  "improvements": "Added fitness context and time estimation"
}
```

### 4. N8N Add Todo (Recommended for chatbots)
**POST** `/n8n/add-todo`

Create a new todo with optional AI enhancement. Perfect for N8N workflows.

**Request Body:**
```json
{
  "title": "call mom",
  "user_email": "user@example.com",
  "enhance": true
}
```

**Response:**
```json
{
  "success": true,
  "todo": {
    "id": 1,
    "title": "👨‍👩‍👧‍👦 Call mom - Tiempo: Flexible",
    "completed": false,
    "user_email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "enhancement": {
    "original_title": "call mom",
    "enhanced_title": "👨‍👩‍👧‍👦 Call mom - Tiempo: Flexible",
    "improvements": "Added personal/family context"
  },
  "message": "Todo \"👨‍👩‍👧‍👦 Call mom - Tiempo: Flexible\" created successfully for user@example.com",
  "n8n_response": {
    "status": "created",
    "id": 1,
    "title": "👨‍👩‍👧‍👦 Call mom - Tiempo: Flexible",
    "user": "user@example.com",
    "enhanced": true
  }
}
```

## N8N Integration

For N8N workflows, use the `/n8n/add-todo` endpoint:

1. **Webhook Node**: Trigger on incoming messages
2. **IF Node**: Check if message contains "#to-do" 
3. **HTTP Request Node**: 
   - Method: POST
   - URL: `YOUR_API_URL/api/n8n/add-todo`
   - Body:
     ```json
     {
       "title": "{{ $json.message }}",
       "user_email": "{{ $json.user_email }}",
       "enhance": true
     }
     ```
4. **Response Node**: Send confirmation back to user

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required parameters)
- `500`: Internal Server Error (database or processing error)

## AI Enhancement Patterns

The AI enhancement recognizes these patterns:

- **Fitness**: gym, exercise, workout → Adds time estimation
- **Work**: meeting, project, email → Adds priority level  
- **Study**: read, course, learn → Adds time goal
- **Health**: doctor, medicine → Adds confirmation reminder
- **Shopping**: buy, market → Adds list preparation
- **Personal**: family, friends → Adds flexible timing
- **Generic**: Short tasks → Suggests more details
- **Questions**: Detects and formats properly
- **Time-based**: today, tomorrow → Adds reminders