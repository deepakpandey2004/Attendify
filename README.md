<div align="center">

<img src="frontend/favicon.svg" alt="Attendify Logo" width="80" height="80" />

# Attendify

### Face-verified smart attendance system with geolocation tracking

Modern SaaS attendance platform that eliminates proxy attendance through AI face recognition, live GPS tracking, and automated background scheduling.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[🌐 Live Demo](https://attendify-eufw.onrender.com)** · **[📖 API Docs](https://attendify-eufw.onrender.com/api/docs)** · **[🐛 Report Bug](https://github.com/deepakpandey2004/Attendify/issues)**

</div>


## 📸 Preview

<div align="center">

<table>
  <tr>
    <td align="center"><b>Login / Sign Up</b></td>
    <td align="center"><b>Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/login.png" alt="Login page" width="450"/></td>
    <td><img src="docs/screenshots/dashboard.png" alt="Dashboard" width="450"/></td>
  </tr>
</table>

</div>


<div align="center">

<img src="frontend/favicon.svg" alt="Attendify Logo" width="80" height="80" />

# Attendify

### Face-verified smart attendance system with geolocation tracking

Modern SaaS attendance platform that eliminates proxy attendance through AI face recognition, live GPS tracking, and automated background scheduling.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[🌐 Live Demo](https://attendify-eufw.onrender.com)** · **[📖 API Docs](https://attendify-eufw.onrender.com/api/docs)** · **[🐛 Report Bug](https://github.com/deepakpandey2004/Attendify/issues)**

</div>

---

## 📸 Preview

<div align="center">

<table>
  <tr>
    <td align="center"><b>Login / Sign Up</b></td>
    <td align="center"><b>Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/login.png" alt="Login page" width="450"/></td>
    <td><img src="docs/screenshots/dashboard.png" alt="Dashboard" width="450"/></td>
  </tr>
</table>

</div>

---

## ✨ Features

### 🔐 Authentication & Security
- **Secure JWT authentication** with bcrypt-hashed passwords
- **One-account-per-face** enforcement — prevents duplicate registrations via face uniqueness check
- **Auto-logout on token expiry** with smart 401 vs 403 error handling
- **HTTPS-only** in production

### 📸 Face Verification
- **AI-powered face matching** using `dlib` (128-dimensional face encodings)
- **Multi-face rejection** — accepts only single-person selfies
- **Configurable match tolerance** (default `0.5` — strict verification)
- **Reference selfie mandatory** during signup (one-time setup)

### 📍 Geolocation Tracking
- **Live GPS coordinates** on every check-in
- **Reverse geocoding** with LocationIQ + BigDataCloud fallback
- **Detailed addresses** — colony, road, city, pincode, state
- **Watermarked selfies** — timestamp + location burned into image

### ⏰ Automated Attendance Rules
- **Login/Logout workflow** — first selfie = login, second = logout
- **Logout reminders** — every 30 min after 10:00 PM
- **Auto-logout at 11:59 PM** — marks incomplete attendance as HALF DAY
- **Weekend detection** — automatic leave marking for missed weekdays
- **Background job scheduler** via APScheduler

### 📊 Attendance Analytics
- **Full history** with status indicators:
  - 🟢 Full Day (login + logout)
  - 🟡 Half Day (auto-logged out)
  - 🔵 Currently Active
  - 🔴 Leave (absent)
- **Real-time stats** — total days, full/half days, attendance percentage
- **Selfie preview** in detail modal for audit trail

### 🎨 Modern UI/UX
- **Notion / Linear inspired design** — clean, minimal SaaS aesthetic
- **Fully responsive** — desktop, tablet, mobile
- **Real-time toast notifications** for user feedback
- **Skeleton loaders** for perceived performance
- **Dark mode camera page** for immersive capture experience

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  HTML/CSS    │  │  Vanilla JS  │  │  MediaDevices    │  │
│  │  Tailwind    │  │  Lucide      │  │  Geolocation API │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Auth   │ │Attendance│ │  Alerts  │ │   Scheduler    │  │
│  │ Router  │ │  Router  │ │  Router  │ │ (APScheduler)  │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Services Layer (Business Logic)            │   │
│  │  auth_service · face_service · attendance_service   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        SQLAlchemy ORM + Alembic Migrations           │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────┬──────────┘
           │                                      │
           ▼                                      ▼
┌────────────────────┐              ┌───────────────────────┐
│  Neon PostgreSQL   │              │   File Storage        │
│  (Serverless DB)   │              │   /uploads/*.jpg      │
└────────────────────┘              └───────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.115 (async Python web framework)
- **Database:** PostgreSQL 16 (via SQLAlchemy 2.0 ORM)
- **Migrations:** Alembic
- **Auth:** JWT (python-jose) + bcrypt password hashing
- **Face Recognition:** `dlib-bin` + `face_recognition` (HOG + ResNet)
- **Scheduler:** APScheduler (cron-based background jobs)
- **Validation:** Pydantic v2

### Frontend
- **Markup:** HTML5, Tailwind CSS (CDN)
- **Interactivity:** Vanilla JavaScript (ES6+)
- **Icons:** Lucide (modern icon library)
- **Camera:** MediaDevices `getUserMedia` API
- **Location:** Browser Geolocation API + Reverse Geocoding

### DevOps
- **Containerization:** Docker + Docker Compose
- **Cloud Hosting:** Render (auto-deploy from GitHub)
- **Database Hosting:** Neon (serverless PostgreSQL)
- **Geocoding APIs:** LocationIQ (primary), BigDataCloud (fallback)
- **CI/CD:** GitHub → Render webhook auto-deploy

---

## 📂 Project Structure

```
attendify/
├── app/                          # FastAPI backend
│   ├── main.py                   # Application entry + route registration
│   ├── config.py                 # Environment settings
│   ├── database.py               # SQLAlchemy engine + session
│   ├── models/                   # ORM models
│   │   ├── user.py
│   │   ├── attendance.py
│   │   └── alert.py
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── routers/                  # API endpoints
│   │   ├── auth.py               # /api/v1/auth/*
│   │   ├── attendance.py         # /api/v1/attendance/*
│   │   └── alerts.py             # /api/v1/alerts/*
│   ├── services/                 # Business logic
│   │   ├── auth_service.py
│   │   ├── face_service.py       # Face detection + matching
│   │   ├── attendance_service.py
│   │   └── scheduler_service.py  # Background jobs
│   ├── utils/                    # Helpers (security, dependencies)
│   └── uploads/                  # Selfie storage
│       ├── reference_faces/      # Signup reference photos
│       └── selfies/              # Daily attendance selfies
├── frontend/                     # Static frontend
│   ├── index.html                # Login / Signup
│   ├── dashboard.html            # Main dashboard
│   ├── capture.html              # Camera capture page
│   ├── reference-face.html       # First-time face setup
│   ├── history.html              # Attendance history
│   ├── css/styles.css            # Design system
│   └── js/
│       ├── config.js             # API config + auth helpers
│       ├── layout.js             # Sidebar + topbar renderer
│       ├── auth.js               # Login/signup logic
│       ├── camera.js             # Camera capture + geocoding
│       ├── attendance.js         # Attendance workflow
│       ├── dashboard.js          # Dashboard logic
│       └── history.js            # History page logic
├── docs/                         # Documentation & screenshots
├── alembic/                      # Database migrations
├── Dockerfile                    # Docker build
├── docker-compose.yml            # Local dev environment (app + postgres)
├── docker-entrypoint.sh          # Startup script (migrations + server)
├── requirements.txt              # Python dependencies
├── render.yaml                   # Render deployment config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **PostgreSQL 16** (or use Docker)
- **Docker Desktop** (recommended for easy setup)
- **Git**

### Option 1: Docker Compose (Recommended)

The fastest way to run locally — includes PostgreSQL, migrations, and the app.

```bash
# Clone the repository
git clone https://github.com/deepakpandey2004/Attendify.git
cd Attendify

# Start everything with one command
docker-compose up --build

# Application will be available at:
# → http://localhost:8000
```

### Option 2: Local Python Setup

```bash
# Clone and enter directory
git clone https://github.com/deepakpandey2004/Attendify.git
cd Attendify

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install --upgrade pip
pip install dlib-bin==20.0.1
pip install --no-deps face_recognition face_recognition_models
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload

# Open in browser:
# → http://localhost:8000
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/attendance_db
SECRET_KEY=your-super-secret-jwt-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> 💡 **Tip:** Generate a strong secret key with `python -c "import secrets; print(secrets.token_urlsafe(48))"`

---

## 📖 API Documentation

Interactive API docs are auto-generated by FastAPI:

- **Swagger UI:** [/api/docs](https://attendify-eufw.onrender.com/api/docs)
- **ReDoc:** [/api/redoc](https://attendify-eufw.onrender.com/api/redoc)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | Create new user account |
| `POST` | `/api/v1/auth/login` | Login with email + password |
| `POST` | `/api/v1/auth/upload-reference-face` | Upload identity selfie (one-time) |
| `GET`  | `/api/v1/auth/me` | Get current user profile |
| `POST` | `/api/v1/attendance/login` | Mark daily login attendance |
| `POST` | `/api/v1/attendance/logout` | Mark daily logout attendance |
| `GET`  | `/api/v1/attendance/today` | Today's attendance status |
| `GET`  | `/api/v1/attendance/history` | Full attendance records with stats |
| `GET`  | `/api/v1/alerts` | Get user notifications |

---

## 🔒 Security Highlights

- ✅ **Passwords never stored in plaintext** — bcrypt with cost factor 12
- ✅ **JWT tokens** with configurable expiry (default 24 hours)
- ✅ **Face uniqueness enforcement** — one person = one account
- ✅ **Live camera only** — gallery uploads blocked in UI
- ✅ **SQL injection prevention** — parameterized queries via SQLAlchemy
- ✅ **CORS configured** for allowed origins
- ✅ **Environment secrets** — never committed to repo (`.gitignore`)
- ✅ **Auto-logout on token expiry** with smart error handling

---

## 🧪 Testing the Workflow

1. **Sign up** with any email + password
2. **Upload reference selfie** — this becomes your identity
3. **Mark LOGIN attendance** with a fresh camera selfie
   - System verifies your face against the reference
   - GPS location is captured with reverse-geocoded address
4. **Continue your workday** — dashboard shows active status
5. **Mark LOGOUT attendance** before 10 PM
   - Miss the deadline? System reminds you every 30 min
   - Forgot to logout? Auto-logout at 11:59 PM = Half Day
6. **View history** — see all records with selfies, times, and locations

---

## 🐳 Deployment

### Docker Deployment

```bash
# Build image
docker build -t attendify:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e SECRET_KEY="..." \
  --name attendify \
  attendify:latest
```

### Render Deployment

1. Fork this repository
2. Sign up at [render.com](https://render.com)
3. Create new **Web Service** → connect your GitHub repo
4. Select **Docker** runtime
5. Add environment variables (`DATABASE_URL`, `SECRET_KEY`, etc.)
6. Deploy 🚀

Render will auto-deploy on every push to `main`.

---

## 🚧 Roadmap

- [ ] Admin dashboard for HR/managers
- [ ] Team/department grouping
- [ ] CSV export of attendance reports
- [ ] Email notifications (SendGrid integration)
- [ ] Liveness detection (blink challenge)
- [ ] Native mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Cloudinary integration for scalable image storage
- [ ] Redis caching for high-traffic scenarios

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👨‍💻 Author

**Deepak Pandey**

- 🌐 **GitHub:** [@deepakpandey2004](https://github.com/deepakpandey2004)
- 💼 **LinkedIn:** [@deepakpandey12](https://www.linkedin.com/in/deepakpandey12)
- 📧 **Email:** deepakpandey4002@gmail.com

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) — for the amazing async web framework
- [face_recognition](https://github.com/ageitgey/face_recognition) — for making face recognition simple
- [Lucide Icons](https://lucide.dev/) — for beautiful open-source icons
- [Neon](https://neon.tech/) — for serverless PostgreSQL
- [Render](https://render.com/) — for hassle-free deployment
- [LocationIQ](https://locationiq.com/) — for reverse geocoding

---

<div align="center">

**⭐ If this project helped you, please give it a star!**

Made with ❤️ by [Deepak Pandey](https://github.com/deepakpandey2004)

</div>