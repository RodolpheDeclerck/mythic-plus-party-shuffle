'use client';

import React from 'react';
import './HomeButton.css';

const HomeButton = () => {
  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <button className="home-button" onClick={handleHome}>
      Home
    </button>
  );
};

export default HomeButton;
