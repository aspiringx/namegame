import { LoginForm, SignupForm } from 'wasp/client/auth';
import { useLocation } from 'react-router-dom';
export function AuthPage() {
    const location = useLocation();
    return (<div style={{ maxWidth: '400px', margin: '0 auto' }}>
      {location.pathname.includes('signup') ? <SignupForm /> : <LoginForm />}
    </div>);
}
//# sourceMappingURL=AuthPage.jsx.map