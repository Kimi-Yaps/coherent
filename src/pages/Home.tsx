import { Link, useNavigate } from 'react-router-dom';
import heroPattern from '../assets/arc-truchet-butterfly-2026-09-11.svg';
import mascotDog from '../assets/MascotDog.png';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="badge">Mental Wellness Support</div>
        
        <h1 className="hero-title">
          Talk with someone<br />
          who truly<br />
          understands.
        </h1>
        
        <p className="hero-description">
          Coherent connects you with compassionate support whenever stress, anxiety, or life's challenges feel overwhelming. You don't have to face it alone.
        </p>
        
        <div className="cta-buttons">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/bookings')}
          >
            Book a Session
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/faq')}
          >
            Learn More
          </button>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="dot"></span> Confidential & Safe
          </div>
          <div className="feature-item">
            <span className="dot"></span> Available 24/7
          </div>
          <div className="feature-item">
            <span className="dot"></span> Expert Listeners
          </div>
        </div>
      </div>
      
      <div className="home-visuals">
        <div className="visual-stage">
          {/* Dark Pattern Card with Green Truchet Pattern */}
          <div className="pattern-card">
            <img src={heroPattern} alt="Coherent pattern" className="pattern-img" />
            
            {/* Pink Sticky Note Badge */}
            <div className="pink-note">
              <span className="pink-note-title">You're not alone</span>
              <span className="pink-note-sub">not anymore</span>
            </div>
          </div>

          {/* Mascot Dog Overlapping the Card */}
          <img src={mascotDog} alt="Coherent Mascot" className="mascot-hero-img" />
        </div>
        
        {/* Floating Feature Bar */}
        <div className="floating-cards">
          <div className="card-item">
            <span className="emoji">😀</span>
            <span className="card-text">Feel better after the session</span>
          </div>
          <div className="divider"></div>
          <div 
            className="card-item clickable" 
            onClick={() => navigate('/ai-support')}
            title="Talk to Chatbot Assistant"
          >
            <span className="emoji">🤖</span>
            <span className="card-text">Chatbot Assistant</span>
          </div>
          <div className="divider"></div>
          <div className="card-item">
            <span className="hours-badge">24/7</span>
            <span className="card-text">Always available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
