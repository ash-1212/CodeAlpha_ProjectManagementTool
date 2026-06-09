import { useState } from 'react'
import { getComments, addComment, deleteComment, updateTask } from '../services/api'

const PRIORITY_COLORS = {
  low: { bg: '#e8f5e9', color: '#2e7d32' },
  medium: { bg: '#fff3e0', color: '#e65100' },
  high: { bg: '#ffebee', color: '#c62828' },
}

// Removed unused 'projectId' parameter
const TaskCard = ({ task, onDragStart, onDelete, currentUserId }) => {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description || '')
  const [editPriority, setEditPriority] = useState(task.priority)
  const [saving, setSaving] = useState(false)

  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium

  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true)
      try {
        const { data } = await getComments(task._id)
        setComments(data)
      } catch {
        console.error('Failed to load comments')
      }
      setLoadingComments(false)
    }
    setShowComments(!showComments)
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      const { data } = await addComment(task._id, commentText)
      setComments([...comments, data])
      setCommentText('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId)
      setComments(comments.filter((c) => c._id !== commentId))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment')
    }
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      await updateTask(task._id, {
        title: editTitle,
        description: editDesc,
        priority: editPriority,
      })
      setShowEdit(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task')
    }
    setSaving(false)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        ...styles.card,
        borderLeft: isOverdue ? '3px solid #c62828' : '3px solid transparent',
        backgroundColor: isOverdue ? '#fff8f8' : '#f8f9fa',
      }}
    >
      {/* Priority Badge */}
      <div style={styles.topRow}>
        <span style={{
          ...styles.priorityBadge,
          backgroundColor: priorityStyle.bg,
          color: priorityStyle.color,
        }}>
          {task.priority.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setShowEdit(!showEdit)} style={styles.editBtn}>✏️</button>
          <button onClick={onDelete} style={styles.deleteBtn}>✕</button>
        </div>
      </div>
      {isOverdue && (
        <div style={styles.overdueBanner}>
          ⚠️ Overdue
        </div>
      )}
      {showEdit ? (
        <div style={styles.editForm}>
          <input
            type='text'
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={styles.editInput}
            placeholder='Task title'
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            style={{ ...styles.editInput, resize: 'none' }}
            placeholder='Description'
            rows={2}
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            style={styles.editInput}
          >
            <option value='low'>Low</option>
            <option value='medium'>Medium</option>
            <option value='high'>High</option>
          </select>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleSaveEdit} style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : '✅ Save'}
            </button>
            <button onClick={() => setShowEdit(false)} style={styles.cancelEditBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4 style={styles.title}>{task.title}</h4>
          {task.description && (
            <p style={styles.desc}>{task.description}</p>
          )}
        </>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <p style={{
          ...styles.dueDate,
          color: isOverdue ? '#c62828' : '#888',
        }}>
          📅 {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && ' — Overdue!'}
        </p>
      )}

      {/* Assignee */}
      {task.assignee && (
        <div style={styles.assignee}>
          <div style={styles.assigneeAvatar}>
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span style={styles.assigneeName}>{task.assignee.name}</span>
        </div>
      )}

      {/* Comments Toggle */}
      <button onClick={toggleComments} style={styles.commentBtn}>
        💬 {showComments ? 'Hide' : 'Comments'}
        {comments.length > 0 && (
          <span style={styles.commentCount}>{comments.length}</span>
        )}
      </button>

      {/* Comments Section */}
      {showComments && (
        <div style={styles.commentsBox}>
          {loadingComments ? (
            <p style={styles.loadingText}>Loading...</p>
          ) : comments.length === 0 ? (
            <p style={styles.noComments}>No comments yet</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} style={styles.comment}>
                <div style={styles.commentHeader}>
                  <strong style={styles.commentAuthor}>{c.user.name}</strong>
                  {c.user._id === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      style={styles.commentDelete}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p style={styles.commentText}>{c.text}</p>
              </div>
            ))
          )}

          {/* Add Comment */}
          <div style={styles.addComment}>
            <input
              type='text'
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.commentInput}
              placeholder='Add a comment...'
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button onClick={handleAddComment} style={styles.commentSubmit}>
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: { background: '#f8f9fa', borderRadius: '10px', padding: '14px', cursor: 'grab', border: '1px solid #f0f2f5', transition: 'box-shadow 0.2s' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  priorityBadge: { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' },
  deleteBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: '14px', cursor: 'pointer', padding: '0' },
  title: { fontSize: '14px', fontWeight: '700', color: '#1e1e2e', marginBottom: '6px', lineHeight: '1.4' },
  desc: { fontSize: '12px', color: '#888', marginBottom: '#888', lineHeight: '1.5' },
  dueDate: { fontSize: '12px', marginBottom: '8px' },
  assignee: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' },
  assigneeAvatar: { width: '22px', height: '22px', borderRadius: '50%', background: '#6c63ff', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  assigneeName: { fontSize: '12px', color: '#555' },
  commentBtn: { background: 'none', border: 'none', color: '#6c63ff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '4px' },
  commentCount: { background: '#6c63ff', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' },
  commentsBox: { marginTop: '10px', borderTop: '1px solid #e0e0e0', paddingTop: '10px' },
  loadingText: { color: '#888', fontSize: '12px' },
  noComments: { color: '#bbb', fontSize: '12px', textAlign: 'center', padding: '8px 0' },
  comment: { marginBottom: '8px', background: '#fff', padding: '8px', borderRadius: '8px' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  commentAuthor: { fontSize: '12px', color: '#1e1e2e' },
  commentDelete: { background: 'none', border: 'none', color: '#e94560', fontSize: '11px', cursor: 'pointer' },
  commentText: { fontSize: '12px', color: '#555' },
  addComment: { display: 'flex', gap: '6px', marginTop: '8px' },
  commentInput: { flex: 1, padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', outline: 'none' },
  commentSubmit: { background: '#6c63ff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  overdueBanner: { background: '#ffebee', color: '#c62828', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', marginBottom: '6px', display: 'inline-block' },
  editBtn: { background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: '0', color: '#6c63ff' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' },
  editInput: { width: '100%', padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  saveBtn: { flex: 1, background: '#6c63ff', color: '#fff', border: 'none', padding: '7px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  cancelEditBtn: { flex: 1, background: 'transparent', border: '1px solid #ddd', color: '#888', padding: '7px', borderRadius: '6px', fontSize: '12px' },
}

export default TaskCard