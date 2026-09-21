# StudyBud - Full-Stack Discussion Platform

A collaborative study room and messaging web application built with Django REST Framework on the backend and React on the frontend.

---

## Tech Stack

- **Backend**: Python, Django 6.1, Django REST Framework, Simple JWT (Authentication), openpyxl (Excel Report Generation & Bulk Upload), ReportLab (PDF Generation), SQLite
- **Frontend**: React 18, React Router v6, Axios, Responsive CSS

---

## Project Structure

```text
studybud/
├── backend/                  # Django REST Framework backend
│   ├── base/                 # Core app (models, views, serializers, reports, throttles)
│   ├── studybud/             # Django project settings & configuration
│   ├── manage.py
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React SPA frontend
│   ├── public/               # Static assets & HTML template
│   ├── src/                  # React source code (components, pages, contexts, api)
│   ├── .env.example          # Environment variables template
│   └── package.json          # Node dependencies & scripts
└── .gitignore
```

---

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv env
   .\env\Scripts\activate

   # macOS / Linux
   python3 -m venv env
   source env/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will run at `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `REACT_APP_API_URL` points to `http://localhost:8000/api`.

4. Start the frontend development server:
   ```bash
   npm start
   ```
   The React application will run at `http://localhost:3000/`.

---

## Core Features

- **Discussion Rooms**: Create, explore, edit, and join topical study rooms.
- **Topics and Activity Tracking**: Filter rooms by topic and follow real-time message feeds.
- **Authentication and Session Security**: User registration, login, token refresh, and auto-logout on session expiration.
- **User Profiles**: Manage bio, avatar images, and view user participant history.
- **Administrative Panel**: Role-based access control for managing rooms, topics, and user accounts.
- **Bulk Excel Room Upload & Template Generator**:
  - **All-or-Nothing Atomic Import**: Two-phase dry-run validation ensures that either 100% of rows are valid and committed atomically via `transaction.atomic()`, or 0 changes are written to the database if duplicates or validation errors exist.
  - **Dynamic Format & Aliases**: Supports flexible header aliases (`room`, `title`, `topic`, `host`, `participants`), dynamic header row detection, and automatic topic resolution.
  - **Downloadable Sample Template**: Pre-styled Excel template (`.xlsx`) with sample rows, instructions, and column structure.
  - **Interactive Review & Correction Modal**: Real-time metric cards, detailed duplicate/error tables with row indicators, and a one-click *"Upload Corrected File"* retry flow.
- **Executive Reports and Data Export**: Dedicated administrative export center for generating custom User and Room activity reports:
  - **Export & View Formats**: Interactive HTML view, direct browser Print, vector PDF export (`reportlab`), and spreadsheet exports in CSV, XLS, and XLSX.
  - **Branded Presentation**: Centered brand logo, full-width executive metadata card, and center-aligned numeric/status data tables.
  - **Granular Filtering**: Filter by topic, creator, participant, role, or date ranges with validation modal alerts.

---

## API Endpoints Reference

### Bulk Room Management
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/rooms/upload-template/` | `GET` | Download sample Excel (`.xlsx`) room upload template with instructions |
| `/api/admin/rooms/bulk-upload/` | `POST` | Bulk upload rooms from Excel (`.xlsx`) with atomic all-or-nothing validation |

### Administrative Reports
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/reports/options/` | `GET` | Dynamic dropdown metadata (users, topics, roles) |
| `/api/admin/reports/users/` | `GET` | User activity report (`?export=html\|pdf\|csv\|xls\|xlsx&auto_print=1`) |
| `/api/admin/reports/rooms/` | `GET` | Room activity report (`?export=html\|pdf\|csv\|xls\|xlsx&auto_print=1`) |

---

## Testing & Verification

### Run Backend Automated Tests
```bash
cd backend
python manage.py test base
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```
