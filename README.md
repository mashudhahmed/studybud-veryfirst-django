# StudyBud - Full-Stack Discussion Platform

A full-stack collaborative study room and messaging web application built with **Django REST Framework** on the backend and **React** on the frontend.

---

## 🚀 Tech Stack

- **Backend**: Python, Django 6.1, Django REST Framework, Simple JWT (Authentication), SQLite
- **Frontend**: React 18, React Router v6, Axios, Modern responsive CSS

---

## 📁 Project Structure

`
studybud/
├── backend/                  # Django REST Framework backend
│   ├── base/                 # Core app (models, views, serializers, throttles)
│   ├── studybud/             # Django project settings & configuration
│   ├── manage.py
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React SPA frontend
│   ├── public/               # Static assets & HTML template
│   ├── src/                  # React source code (components, pages, contexts, api)
│   ├── .env.example          # Environment variables template
│   └── package.json          # Node dependencies & scripts
└── .gitignore
`

---

## 🛠️ Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   `ash
   cd backend
   `

2. Create and activate a Python virtual environment:
   `ash
   # Windows
   python -m venv env
   .\env\Scripts\activate

   # macOS / Linux
   python3 -m venv env
   source env/bin/activate
   `

3. Install required dependencies:
   `ash
   pip install -r requirements.txt
   `

4. Apply database migrations:
   `ash
   python manage.py migrate
   `

5. (Optional) Create a superuser:
   `ash
   python manage.py createsuperuser
   `

6. Start the backend development server:
   `ash
   python manage.py runserver
   `
   The backend API will run at http://127.0.0.1:8000/.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   `ash
   cd frontend
   `

2. Install Node dependencies:
   `ash
   npm install
   `

3. Configure environment variables:
   Copy .env.example to .env:
   `ash
   cp .env.example .env
   `
   Ensure REACT_APP_API_URL points to http://localhost:8000/api.

4. Start the frontend development server:
   `ash
   npm start
   `
   The React application will run at http://localhost:3000/.

---

## 🔑 Features

- 💬 **Discussion Rooms**: Browse, create, edit, and join topical study rooms.
- 👥 **Topics & Activity**: Filter rooms by topic and track real-time activity feeds.
- 🔒 **JWT Authentication**: User registration, login, token refresh, and auto-logout on inactivity.
- 👤 **User Profiles**: Manage bio, avatar, and view participant activity.
- 🛡️ **Admin Panel**: Role-based access control for managing rooms, topics, and users.
