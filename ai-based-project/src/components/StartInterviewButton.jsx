import React from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewSetup from '../Pages/InterviewSetup';

const StartInterviewButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/interviewsetup'); // Navigate to the Interview Setup page
  };

  return (
    <button
      onClick={handleClick}
      className="shine-hover bg-primary text-primary-foreground font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
    >
      Start New Interview
    </button>
  );
};

export default StartInterviewButton;
