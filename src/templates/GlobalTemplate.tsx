import React, { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, logout } from 'wasp/client/auth';
import '../Main.css';

type GlobalTemplateProps = {
  children: ReactNode;
};

const GlobalTemplate: React.FC<GlobalTemplateProps> = ({ children }) => {
  const { data: user } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  return (
    <div className="global-template">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">NameGame</div>
          <div className="header-right-controls">
            <div className="hamburger-menu">&#9776;</div>
            <div className="user-profile-container">
              <img
                // TODO: Leave this dynamic photo source commented out for later. 
                // src={user?.photo?.url || '/default-user.png'} // Provide a default user image
                src={'/default-user.png'} // Using a static placeholder for now
                alt="User Profile"
                className="user-profile-image"
                onClick={toggleDropdown}
              />
              {isDropdownOpen && (
                <div className="user-profile-dropdown">
                  {user ? (
                    <a href="#" onClick={() => logout()} className="dropdown-link">Logout</a>
                  ) : (
                    <Link to="/login" className="dropdown-link">Login</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 NameGame</p>
      </footer>
    </div>
  );
};

export default GlobalTemplate;
