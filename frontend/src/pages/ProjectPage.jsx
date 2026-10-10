import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProjectById,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  addMember,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import TaskCard from '../components/TaskCard'

const COLUMNS = [
  { id: 'todo', label: '📋 To Do', color: '#e94560' },
  { id: 'inprogress', label: '⚡ In Progress', color: '#f5a623' },
  { id: 'done', label: '✅ Done', color: '#2ecc71' },
]

let socket

const ProjectPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userInfo } = useAuth()
  
  const [notifications, setNotifications] = useState([])
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [draggedTask, setDraggedTask] = useState(null)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskStatus, setTaskStatus] = useState('todo')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        getProjectById(id),
        getTasksByProject(id),
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setLoading(false)
    } catch {
      navigate('/')
    }
  }, [id, navigate])

  const setupSocket = useCallback(() => {
    socket = io('http://localhost:5000')

    socket.emit('joinProject', id)

    socket.on('taskCreated', (task) => {
      setTasks((prev) => [task, ...prev])
    })

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      )
    })

    socket.on('taskDeleted', ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    })

    socket.on('memberAdded', ({ project: updatedProject }) => {
      setProject(updatedProject)
    })

    // Notify when a task is assigned to current user
    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      )
      // Show notification if this task was just assigned to me
      if (
        updatedTask.assignee &&
        updatedTask.assignee._id === userInfo?._id
      ) {
        const notif = {
          id: Date.now(),
          message: `You were assigned: "${updatedTask.title}"`,
        }
        setNotifications((prev) => [notif, ...prev])
        // Auto remove after 4 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
        }, 4000)
      }
    })
  }, [id, userInfo?._id])

  useEffect(() => {
    const fetchData = async () => {
      await loadData()
    };
    
    fetchData()
    setupSocket()

    return () => {
      if (socket) {
        socket.emit('leaveProject', id)
        socket.disconnect()
      }
    }
  }, [loadData, setupSocket, id])

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) return
    try {
      await updateTask(draggedTask._id, { status: newStatus })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task')
    }
    setDraggedTask(null)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setCreating(true)
    try {
      await createTask({
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: taskStatus,
        projectId: id,
        assigneeId: taskAssignee || null,
        dueDate: taskDueDate || null,
      })
      setTaskTitle('')
      setTaskDesc('')
      setTaskPriority('medium')
      setTaskStatus('todo')
      setTaskAssignee('')
      setTaskDueDate('')
      setShowTaskForm(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task')
    }
    setCreating(false)
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(taskId)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    try {
      await addMember(id, memberEmail)
      setMemberEmail('')
      setShowMemberForm(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member')
    }
  }

  const getTasksByStatus = (status) =>
    tasks.filter((t) => t.status === status)

  if (loading) return <div style={styles.center}>Loading board...</div>
  if (!project) return null

  const isOwner = project.owner._id === userInfo?._id

  return (
    <div style={styles.page}>
      {/* Notifications */}
      <div style={styles.notifContainer}>
        {notifications.map((n) => (
          <div key={n.id} style={styles.notifCard}>
            🔔 {n.message}
            <button
              onClick={() =>
                setNotifications((prev) => prev.filter((x) => x.id !== n.id))
              }
              style={styles.notifClose}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ ...styles.projectHeader, borderColor: project.color }}>
        <div className='container'>
          <div style={styles.headerInner}>
            <div>
              <button onClick={() => navigate('/')} style={styles.backBtn}>
                ← Dashboard
              </button>
              <h1 style={styles.projectTitle}>
                <span style={{ color: project.color }}>●</span> {project.title}
              </h1>
              {project.description && (
                <p style={styles.projectDesc}>{project.description}</p>
              )}
              {/* Project Stats */}
              <div style={styles.statsBar}>
                <div style={styles.statBox}>
                  <span style={styles.statNum}>{tasks.length}</span>
                  <span style={styles.statLabel}>Total Tasks</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ ...styles.statNum, color: '#e94560' }}>
                    {getTasksByStatus('todo').length}
                  </span>
                  <span style={styles.statLabel}>To Do</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ ...styles.statNum, color: '#f5a623' }}>
                    {getTasksByStatus('inprogress').length}
                  </span>
                  <span style={styles.statLabel}>In Progress</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ ...styles.statNum, color: '#2ecc71' }}>
                    {getTasksByStatus('done').length}
                  </span>
                  <span style={styles.statLabel}>Done</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ ...styles.statNum, color: '#6c63ff' }}>
                    {tasks.length > 0
                      ? Math.round((getTasksByStatus('done').length / tasks.length) * 100)
                      : 0}%
                  </span>
                  <span style={styles.statLabel}>Complete</span>
                </div>
              </div>
              {/* Progress Bar */}
              {tasks.length > 0 && (
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.round(
                        (getTasksByStatus('done').length / tasks.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
              <div style={styles.membersList}>
                👥 {project.members.map((m) => (
                  <span key={m._id} style={styles.memberChip}>{m.name}</span>
                ))}
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                style={styles.addTaskBtn}
              >
                + Add Task
              </button>
              {isOwner && (
                <button
                  onClick={() => setShowMemberForm(!showMemberForm)}
                  style={styles.addMemberBtn}
                >
                  + Member
                </button>
              )}
            </div>
          </div>

          {showMemberForm && (
            <form onSubmit={handleAddMember} style={styles.inlineForm}>
              <input
                type='email'
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                style={styles.inlineInput}
                placeholder='Enter member email address'
                required
              />
              <button type='submit' style={styles.inlineBtn}>Add</button>
              <button
                type='button'
                onClick={() => setShowMemberForm(false)}
                style={styles.inlineCancelBtn}
              >
                Cancel
              </button>
            </form>
          )}

          {showTaskForm && (
            <div style={styles.taskForm}>
              <h3 style={styles.taskFormTitle}>Create New Task</h3>
              <form onSubmit={handleCreateTask}>
                <div style={styles.taskFormGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Title *</label>
                    <input
                      type='text'
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      style={styles.input}
                      placeholder='Task title'
                      required
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      style={styles.input}
                    >
                      <option value='todo'>To Do</option>
                      <option value='inprogress'>In Progress</option>
                      <option value='done'>Done</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      style={styles.input}
                    >
                      <option value='low'>Low</option>
                      <option value='medium'>Medium</option>
                      <option value='high'>High</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Assign To</label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      style={styles.input}
                    >
                      <option value=''>Unassigned</option>
                      {project.members.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Due Date</label>
                    <input
                      type='date'
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      style={{ ...styles.input, resize: 'none' }}
                      placeholder='Task details...'
                      rows={2}
                    />
                  </div>
                </div>
                <div style={styles.taskFormActions}>
                  <button type='submit' style={styles.addTaskBtn} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Task'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowTaskForm(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className='container'>
        <div style={styles.board}>
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              style={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div style={styles.colHeader}>
                <span style={{ ...styles.colDot, backgroundColor: col.color }} />
                <span style={styles.colLabel}>{col.label}</span>
                <span style={styles.colCount}>
                  {getTasksByStatus(col.id).length}
                </span>
              </div>

              <div style={styles.taskList}>
                {getTasksByStatus(col.id).length === 0 ? (
                  <div style={styles.emptyCol}>Drop tasks here</div>
                ) : (
                  getTasksByStatus(col.id).map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onDragStart={() => handleDragStart(task)}
                      onDelete={() => handleDeleteTask(task._id)}
                      currentUserId={userInfo?._id}
                      projectId={id}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', paddingBottom: '40px' },
  center: { textAlign: 'center', padding: '60px', color: '#888', fontSize: '18px' },
  projectHeader: { background: '#fff', borderTop: '4px solid', paddingTop: '20px', paddingBottom: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  backBtn: { background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '8px', padding: '0' },
  projectTitle: { fontSize: '24px', fontWeight: '800', color: '#1e1e2e', display: 'flex', alignItems: 'center', gap: '10px' },
  projectDesc: { color: '#888', fontSize: '14px', marginTop: '4px', marginBottom: '10px' },
  membersList: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#888' },
  memberChip: { background: '#f0f2f5', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', color: '#555' },
  headerActions: { display: 'flex', gap: '10px', flexShrink: 0 },
  addTaskBtn: { background: '#6c63ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' },
  addMemberBtn: { background: '#1e1e2e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' },
  inlineForm: { display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' },
  inlineInput: { flex: 1, padding: '10px 16px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  inlineBtn: { background: '#6c63ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' },
  inlineCancelBtn: { background: 'transparent', color: '#888', border: '1px solid #ddd', padding: '10px 16px', borderRadius: '8px', fontSize: '14px' },
  taskForm: { background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginTop: '16px' },
  taskFormTitle: { fontSize: '16px', fontWeight: '700', color: '#1e1e2e', marginBottom: '16px' },
  taskFormGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  field: { marginBottom: '0' },
  label: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555', fontSize: '13px' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '7px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  taskFormActions: { display: 'flex', gap: '10px', marginTop: '16px' },
  cancelBtn: { background: 'transparent', color: '#888', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', fontSize: '14px' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  column: { background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', minHeight: '400px' },
  colHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f2f5' },
  colDot: { width: '10px', height: '10px', borderRadius: '50%' },
  colLabel: { flex: 1, fontWeight: '700', fontSize: '15px', color: '#1e1e2e' },
  colCount: { background: '#f0f2f5', color: '#888', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' },
  emptyCol: { border: '2px dashed #e0e0e0', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#ccc', fontSize: '13px' },
  statsBar: { display: 'flex', gap: '24px', margin: '16px 0 8px', flexWrap: 'wrap' },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: '22px', fontWeight: '800', color: '#1e1e2e' },
  statLabel: { fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  progressBar: { width: '100%', height: '6px', backgroundColor: '#f0f2f5', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6c63ff', borderRadius: '10px', transition: 'width 0.5s ease' },
  notifContainer: { position: 'fixed', top: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' },
  notifCard: { background: '#1e1e2e', color: '#fff', padding: '14px 18px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', animation: 'slideIn 0.3s ease' },
  notifClose: { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px', marginLeft: 'auto' },
}

export default ProjectPage;