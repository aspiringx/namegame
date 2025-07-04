import { LoginForm, SignupForm } from 'wasp/client/auth'
import { useLocation, Link } from 'react-router-dom'

export function AuthPage() {
  const location = useLocation()

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      {location.pathname.includes('signup') 
      ? <><SignupForm /> or go to login (<Link to="/login">Login</Link>)</>
      : <><LoginForm /> or go to signup (<Link to="/signup">Signup</Link>)</>}
    </div>
  )
}
