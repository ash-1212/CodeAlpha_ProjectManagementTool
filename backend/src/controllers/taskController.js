const Task = require('../models/taskModel')
const Project = require('../models/projectModel')

// GET ALL TASKS FOR A PROJECT
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(tasks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body

    // Verify project exists
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      project: projectId,
      assignee: assigneeId || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
    })

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')

    // Emit real-time event to everyone in the project room
    req.io.to(projectId).emit('taskCreated', populatedTask)

    res.status(201).json(populatedTask)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// UPDATE TASK — status, priority, assignee, etc
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Update only the fields that were sent
    task.title = req.body.title || task.title
    task.description = req.body.description ?? task.description
    task.status = req.body.status || task.status
    task.priority = req.body.priority || task.priority
    task.assignee = req.body.assigneeId !== undefined
      ? req.body.assigneeId
      : task.assignee
    task.dueDate = req.body.dueDate !== undefined
      ? req.body.dueDate
      : task.dueDate

    const updatedTask = await task.save()

    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')

    // Emit real-time event — everyone in project sees task update instantly
    req.io.to(task.project.toString()).emit('taskUpdated', populatedTask)

    res.json(populatedTask)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const projectId = task.project.toString()

    await Task.findByIdAndDelete(req.params.id)

    // Emit real-time event
    req.io.to(projectId).emit('taskDeleted', { taskId: req.params.id })

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
}