import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { userInfo, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to='/' style={styles.logo}>
          📋 <span style={styles.logoAccent}>TaskFlow</span>
        </Link>
        <div style={styles.right}>
          {userInfo && (
            <>
              <span style={styles.greeting}>👋 {userInfo.name}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #1e1e2e, #13131f)',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoAccent: { color: '#6c63ff' },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: '14px' },
  logoutBtn: {
    background: 'transparent',
    color: '#6c63ff',
    border: '1px solid #6c63ff',
    padding: '7px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
}

export default Navbar