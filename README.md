# TaskFlow — Project Management Tool
### CodeAlpha Full Stack Development Internship — Task 3

A full-stack project management tool built with MERN stack and real-time features using Socket.io.

---

## 🌟 Features

- 👤 User authentication with JWT
- 📋 Create and manage multiple projects
- 🎨 Color-coded project cards
- 👥 Add team members to projects
- ✅ Kanban board with three columns — To Do, In Progress, Done
- 🖱️ Drag and drop tasks between columns
- ✏️ Edit task details after creation
- 📊 Project stats with progress bar
- 🔔 Real-time notifications when assigned a task
- 📅 Overdue task highlighting
- 💬 Comments on every task
- 🎯 Task priority levels — Low, Medium, High
- 👤 Task assignment to team members
- ⚡ Real-time updates with Socket.io

---

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- React Router DOM
- Axios
- Socket.io Client
- Context API

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- bcrypt
- Socket.io

---

## 📁 Project Structure
project-management/
├── backend/
│   ├── src/
│   │   ├── config/        → db.js
│   │   ├── models/        → userModel, projectModel, taskModel, commentModel
│   │   ├── controllers/   → auth, project, task, comment
│   │   ├── routes/        → auth, project, task, comment
│   │   └── middleware/    → authMiddleware
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
└── src/
├── components/    → Navbar, TaskCard
├── pages/         → Login, Register, Dashboard, Project
├── context/       → AuthContext
├── services/      → api.js
├── App.jsx
└── main.jsx

---

## 🚀 Run Locally

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create `.env` in the backend folder:
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

---

## 🗄️ Database Schema

### Users
name, email, password (hashed), avatar, createdAt

### Projects
title, description, color, owner (ref User), members [ref User]

### Tasks
title, description, status, priority, project (ref), assignee (ref), createdBy (ref), dueDate

### Comments
text, task (ref), user (ref), createdAt

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Get my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:memberId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/project/:id` | Get project tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/comments/:taskId` | Get comments |
| POST | `/api/comments/:taskId` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |

---

## ⚡ Real-Time Events (Socket.io)

| Event | Description |
|---|---|
| `joinProject` | User joins project room |
| `taskCreated` | New task appears for all members |
| `taskUpdated` | Task changes visible to all |
| `taskDeleted` | Task removed for all members |
| `memberAdded` | Project updates when member joins |

---


## 🔮 Future Improvements

- File attachments on tasks
- Task labels and tags
- Activity log per project
- Email notifications
- Mobile app with React Native
- Dark mode

---

## 👩‍💻 Developer

Ayesha Nazish
Full Stack Development Intern — CodeAlpha
GitHub: 

---

## 📄 License
Built for educational purposes as part of the CodeAlpha Internship Program.