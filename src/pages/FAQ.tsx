import { useState } from 'react';
import './FAQ.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: 'Is my conversation private?',
      answer: 'Yes, completely. All conversations on Coherent are encrypted and confidential. We adhere to strict privacy practices so you can speak freely without concern.'
    },
    {
      id: 2,
      question: 'Who are the listeners?',
      answer: 'Our listeners are trained, compassionate individuals and certified wellness guides with deep experience in active listening and empathetic dialogue.'
    },
    {
      id: 3,
      question: 'Can I talk to someone right now?',
      answer: 'Yes. Our AI Support and on-demand listeners are available 24/7. You can either chat immediately or schedule a focused 1-on-1 session at your preferred time.'
    },
    {
      id: 4,
      question: 'What if I need to change a session?',
      answer: 'You can reschedule any upcoming session with a single click from the Reschedule tab in Bookings, with no cancellation fees or hassle.'
    },
    {
      id: 5,
      question: 'Is Coherent a crisis service?',
      answer: 'Coherent is designed for peer listening, stress reduction, and emotional support. If you or someone you know is in immediate crisis, please reach out to emergency services or local crisis helplines directly.'
    }
  ];

  return (
    <div className="faq-container">
      <div className="faq-content">
        <h1 className="display-header faq-title">Questions, answered.</h1>
        <p className="faq-subtitle">Everything worth knowing before your first conversation.</p>
        <div className="faq-divider" />
        
        <div className="faq-list">
          {faqData.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div 
                key={item.id} 
                className={`faq-item-wrapper ${isOpen ? 'open' : ''}`}
              >
                <div 
                  className="faq-item" 
                  onClick={() => toggleAccordion(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAccordion(item.id);
                    }
                  }}
                >
                  <span className="faq-question">{item.question}</span>
                  <span className={`faq-icon ${isOpen ? 'rotated' : ''}`}>+</span>
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
