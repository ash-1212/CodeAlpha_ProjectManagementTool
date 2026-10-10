const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')
const connectDB = require('./src/config/db')
const authRoutes = require('./src/routes/authRoutes')
const projectRoutes = require('./src/routes/projectRoutes')
const taskRoutes = require('./src/routes/taskRoutes')
const commentRoutes = require('./src/routes/commentRoutes')

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
})

connectDB()

app.use(cors())
app.use(express.json())

// Make io accessible in all controllers
app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/comments', commentRoutes)

// Socket.io events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on('joinProject', (projectId) => {
    socket.join(projectId)
    console.log(`Socket ${socket.id} joined project ${projectId}`)
  })

  socket.on('leaveProject', (projectId) => {
    socket.leave(projectId)
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

app.get('/', (req, res) => {
  res.json({ message: 'Project Management API is running!' })
})

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
