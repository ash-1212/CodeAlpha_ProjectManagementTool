const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // Who created this project
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // All members including owner
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Project color for visual distinction
    color: {
      type: String,
      default: '#6c63ff',
    },
  },
  { timestamps: true }
)

const Project = mongoose.model('Project', projectSchema)
module.exports = Project