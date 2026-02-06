# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Manual Setup

#### Step 1: Database

```sql
-- Create database
CREATE DATABASE web_presentations;

-- Import schema
mysql -u root -p web_presentations < backend/db/init.sql
```

#### Step 2: Configure Backend

Edit `backend/config/database.php`:
```php
const DB_HOST = 'localhost';
const DB_NAME = 'web_presentations';
const DB_USER = 'your_username';
const DB_PASS = 'your_password';
```

#### Step 3: Configure Frontend

Edit `frontend/shared/APIService.js`:
```javascript
this.baseURL = 'http://localhost/your-path/backend/public';
```

#### Step 4: Set Permissions

```bash
mkdir -p backend/generated/presentations
chmod 777 backend/generated/presentations
```

#### Step 5: Configure Web Server

**Apache:** Create `backend/public/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

**Nginx:** Add to server config:
```nginx
location /api {
    try_files $uri $uri/ /backend/public/index.php?$query_string;
}
```

## ✅ Verify Installation

1. **Test the API:**
```bash
curl http://localhost/your-path/backend/public/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01 10:00:00"
}
```

2. **Open the Editor:**
   Navigate to the editor and create a test presentation

3. **Check the Dashboard:**
   Verify your presentation appears in the dashboard

## 📝 Create Your First Presentation

1. Open the **Editor**
2. Write this SLIM code:
```slim
#presentation My First Presentation
#presentationType lecture

#slide
#title Welcome
#type title
#data subtitle=Getting Started;author=Your Name

#slide
#title Hello World
#type text-only
#data content=This is my first slide!
```

3. Click **"Save"** to store locally
4. Click **"Generate"** to publish to the backend
5. View in the **Dashboard**
6. Click **"View"** to see your presentation

## 🔧 Troubleshooting

### Problem: "Database connection failed"
**Solution:** Check credentials in `backend/config/database.php`

### Problem: "API endpoint not found"
**Solution:** 
- Verify `.htaccess` exists in `backend/public/`
- Check Apache `mod_rewrite` is enabled:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Problem: "CORS error in browser"
**Solution:** Verify CORS headers in `backend/public/index.php`

### Problem: "Permission denied" when saving
**Solution:**
```bash
chmod 777 backend/generated/presentations
```

## 📚 Next Steps

1. Read the full [README.md](README.md)
2. Explore the SLIM markup language
3. Try different slide types
4. Customize the themes
5. Build your presentations!

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review the architecture diagram
- Look at example presentations in the editor
- Check PHP error logs: `/var/log/apache2/error.log`

---

**Happy presenting!** 🎉