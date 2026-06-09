const Project = require('../models/projectModel')
const Task = require('../models/taskModel')
const User = require('../models/userModel')

// GET ALL MY PROJECTS
const getProjects = async (req, res) => {
  try {
    // Get projects where user is owner OR member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })

    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    const { title, description, color } = req.body

    const project = await Project.create({
      title,
      description,
      color: color || '#6c63ff',
      owner: req.user._id,
      // Owner is automatically a member
      members: [req.user._id],
    })

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')

    res.status(201).json(populatedProject)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET SINGLE PROJECT
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only members can view the project
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    )

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this project' })
    }

    res.json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE PROJECT
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this project' })
    }

    await Project.findByIdAndDelete(req.params.id)
    // Delete all tasks in this project too
    await Task.deleteMany({ project: req.params.id })

    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ADD MEMBER TO PROJECT
const addMember = async (req, res) => {
  try {
    const { email } = req.body

    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only owner can add members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can add members' })
    }

    // Find user by email
    const userToAdd = await User.findOne({ email })
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' })
    }

    // Check if already a member
    const alreadyMember = project.members.includes(userToAdd._id)
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' })
    }

    project.members.push(userToAdd._id)
    await project.save()

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')

    // Emit real-time event to everyone in the project room
    req.io.to(req.params.id).emit('memberAdded', {
      project: updatedProject,
      newMember: { name: userToAdd.name, email: userToAdd.email },
    })

    res.json(updatedProject)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// REMOVE MEMBER
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' })
    }

    // Cannot remove the owner
    if (req.params.memberId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' })
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.memberId
    )
    await project.save()

    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  deleteProject,
  addMember,
  removeMember,
}