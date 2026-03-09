# Web Presentation System

A full-stack presentation management system with a custom SLIM markup language for creating, editing, and viewing presentations.

## Features

- **SLIM Markup Editor** - Simple markup language for creating presentations
- **Real-time Preview** - See your presentation as you type
- **Dashboard** - Manage all your presentations
- **Slide Viewer** - Full presentation viewing experience
- **Slide Map** - Visual navigation of presentation structure
- **Backend API** - Full REST API with CRUD operations
- **MySQL Database** - Persistent storage
- **HTML Generator** - Generate static HTML presentations
- **LocalStorage Integration** - Offline editing capability

## Architecture

### Frontend
- **Editor** - SLIM markup editor with syntax highlighting
- **Dashboard** - Presentation management interface
- **Viewer** - Presentation viewing interface
- **Slide Map** - Visual slide navigation
- **Shared Services** - API service, utilities, components

### Backend (PHP)
- **Controllers** - Handle HTTP requests
- **Services** - Business logic layer
- **Repositories** - Data access layer
- **Parsers** - SLIM to Presentation object conversion
- **Generators** - HTML generation from presentations
- **Models** - Data models (Presentation, Slide)

### Database (MySQL)
- **presentations** - Stores presentation metadata
- **slides** - Stores slide data
- **slide_types** - Lookup table for slide types
- **slide_map** - Navigation structure

## Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Modern web browser

### Step 1: Database Setup

1. Create the database:
```sql
CREATE DATABASE web_presentations;
```

2. Import the schema:
```bash
mysql -u root -p web_presentations < backend/db/init.sql
```

Or manually run the SQL from `backend/db/init.sql`

### Step 2: Backend Configuration

1. Update database credentials in `backend/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'web_presentations');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

2. Create the generated presentations directory:
```bash
mkdir -p backend/generated/presentations
chmod 777 backend/generated/presentations
```

3. Ensure PHP has write permissions to the generated directory.

### Step 3: Frontend Configuration

Update the API base URL in `frontend/shared/APIService.js`:
```javascript
this.baseURL = 'http://localhost/your-project-path/backend/public';
```

Replace `your-project-path` with your actual project directory path.

### Step 4: Web Server Configuration

#### Apache (.htaccess in backend/public/)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

#### Nginx
```nginx
location /api {
    try_files $uri $uri/ /backend/public/index.php?$query_string;
}
```

### Step 5: Access the Application

1. **Editor**: `http://localhost/your-project-path/frontend/editor/editor.html`
2. **Dashboard**: `http://localhost/your-project-path/frontend/dashboard/dashboard.html`
3. **Viewer**: `http://localhost/your-project-path/frontend/viewer/viewer.html`

## API Endpoints

### GET /api/presentations
Get all presentations
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "My Presentation",
      "slug": "my-pres-2024",
      "presentation_type": "lecture",
      "created_at": "2024-01-01 10:00:00",
      "slides": 5
    }
  ]
}
```

### GET /api/presentation?id=1
Get single presentation with slides
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Presentation",
    "slug": "my-pres-2024",
    "type": "lecture",
    "created_at": "2024-01-01 10:00:00",
    "slides": [...]
  }
}
```

### POST /api/generate
Generate presentation from SLIM content
```json
{
  "slim": "#presentation My Title\n#slide\n#title Hello World"
}
```

Response:
```json
{
  "success": true,
  "message": "Presentation generated successfully",
  "data": {
    "id": 1,
    "slug": "my-pres-2024",
    "title": "My Presentation",
    "type": "lecture",
    "slides": 5
  }
}
```

### PUT /api/presentation?id=1
Update presentation
```json
{
  "slim": "#presentation Updated Title\n..."
}
```

### DELETE /api/presentation?id=1
Delete presentation

### GET /api/health
Health check endpoint

## SLIM Markup Format

### Presentation Header
```slim
#presentation My Presentation Title
#presentationType lecture
#slug my-pres-2024
```

### Slide Types

#### Title Slide
```slim
#slide
#title Introduction
#type title
#data subtitle=Welcome to the Course;author=John Doe
```

#### Text Slide
```slim
#slide
#title Content Slide
#type text-only
#data content=This is the main content of the slide
```

#### Code Slide
```slim
#slide
#title Code Example
#type code
#data code=console.log('Hello World');language=JavaScript
```

#### Image + Text Slide
```slim
#slide
#title Visual Example
#type image-text
#data image=path/to/image.jpg;caption=Example Image;text=Description
```

## Usage Guide

### Creating a Presentation

1. Open the Editor
2. Write your presentation in SLIM format
3. Click "Save" to store locally
4. Click "Generate" to publish to backend and generate HTML
5. View in Dashboard

### Editing a Presentation

1. Go to Dashboard
2. Click "Edit" on any presentation
3. Modify the SLIM content
4. Save or Generate

### Viewing a Presentation

1. Go to Dashboard or Viewer
2. Select a presentation
3. Use arrow keys or navigation to move between slides

### Deleting a Presentation

1. Go to Dashboard
2. Click "Delete" on a presentation
3. Confirm deletion

## Future Enhancements
- Presentation sharing
- Export to PDF/PPTX
- Collaborative editing
- Presentation templates
- Media library
- Analytics and tracking
- Mobile responsive viewer
- Real-time collaboration
- Version control

---

### Забележка !!!
Подробна документация можете да намерите във файла documentation.
