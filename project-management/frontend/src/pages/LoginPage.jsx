import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await loginUser({ email, password })
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>📋</div>
        <h2 style={styles.title}>Welcome to TaskFlow</h2>
        <p style={styles.sub}>Login to manage your projects</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder='you@example.com'
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder='••••••••'
              required
            />
          </div>
          <button type='submit' style={styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{' '}
          <Link to='/register' style={styles.link}>Register here</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e1e2e, #13131f)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  icon: { fontSize: '40px', textAlign: 'center', marginBottom: '12px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1e1e2e', textAlign: 'center', marginBottom: '6px' },
  sub: { color: '#888', textAlign: 'center', marginBottom: '28px', fontSize: '14px' },
  error: { background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '500', color: '#555', fontSize: '14px' },
  input: { width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '13px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', marginTop: '8px' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' },
  link: { color: '#6c63ff', fontWeight: '600' },
}

export default LoginPage