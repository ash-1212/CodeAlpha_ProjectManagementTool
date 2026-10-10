import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Auto attach token to every request
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const { token } = JSON.parse(userInfo)
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// AUTH
export const registerUser = (data) => API.post('/auth/register', data)
export const loginUser = (data) => API.post('/auth/login', data)

// PROJECTS
export const getProjects = () => API.get('/projects')
export const createProject = (data) => API.post('/projects', data)
export const getProjectById = (id) => API.get(`/projects/${id}`)
export const deleteProject = (id) => API.delete(`/projects/${id}`)
export const addMember = (projectId, email) =>
  API.post(`/projects/${projectId}/members`, { email })
export const removeMember = (projectId, memberId) =>
  API.delete(`/projects/${projectId}/members/${memberId}`)

// TASKS
export const getTasksByProject = (projectId) =>
  API.get(`/tasks/project/${projectId}`)
export const createTask = (data) => API.post('/tasks', data)
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data)
export const deleteTask = (id) => API.delete(`/tasks/${id}`)

// COMMENTS
export const getComments = (taskId) => API.get(`/comments/${taskId}`)
export const addComment = (taskId, text) =>
  API.post(`/comments/${taskId}`, { text })
export const deleteComment = (id) => API.delete(`/comments/${id}`)