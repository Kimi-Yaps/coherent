import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import './Profile.css';

const Profile = () => {
  const [name, setName] = useState('Iman Hakimi');
  const [username, setUsername] = useState('ImanHakimi');
  const [email, setEmail] = useState('ImanHakimi@gmail.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
            <div className="profile-avatar">IH</div>
            <div className="profile-info">
              <h2>{name}</h2>
              <span className="username-tag">@{username}</span>
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
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Profile;
