const express = require('express')
const router = express.Router()
const {
  getProjects,
  createProject,
  getProjectById,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', protect, getProjects)
router.post('/', protect, createProject)
router.get('/:id', protect, getProjectById)
router.delete('/:id', protect, deleteProject)
router.post('/:id/members', protect, addMember)
router.delete('/:id/members/:memberId', protect, removeMember)

module.exports = router