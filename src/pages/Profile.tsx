import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut, role } = useAuth();
  
  const [name, setName] = useState(profile?.displayName || 'Iman Hakimi');
  const [username, setUsername] = useState(profile?.username || 'ImanHakimi');
  const [email, setEmail] = useState(profile?.email || 'ImanHakimi@gmail.com');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const initials = (name.split(' ').map((n) => n[0]).join('') || 'U').slice(0, 2).toUpperCase();

  const sidebarContent = (
    <div className="profile-sidebar">
      <button className="sidebar-nav-btn active">Profile Settings</button>
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent} className="profile-layout">
      <div className="profile-container">
        <h1 className="display-header profile-page-header">Profile settings</h1>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <h2>{name}</h2>
              <div className="username-tag">
                <span>@{username}</span>
                <span className="profile-role-badge">{role}</span>
              </div>
            </div>
          </div>
          
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="form-input" 
              />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="form-input" 
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="form-input" 
              />
            </div>
            
            <div className="form-actions-row">
              <button type="submit" className="save-btn">
                {saved ? 'Changes Saved!' : 'Save Changes'}
              </button>
              <button type="button" className="signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Profile;
