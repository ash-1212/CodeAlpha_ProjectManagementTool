const Comment = require('../models/commentModel')
const Task = require('../models/taskModel')

// GET COMMENTS FOR A TASK
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 })

    res.json(comments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const comment = await Comment.create({
      text: req.body.text,
      task: req.params.taskId,
      user: req.user._id,
    })

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email')

    // Emit real-time comment to everyone in the project
    req.io
      .to(task.project.toString())
      .emit('commentAdded', {
        taskId: req.params.taskId,
        comment: populatedComment,
      })

    res.status(201).json(populatedComment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await Comment.findByIdAndDelete(req.params.id)
    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getComments, addComment, deleteComment }