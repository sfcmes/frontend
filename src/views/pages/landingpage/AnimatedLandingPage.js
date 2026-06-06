// src/components/landingpage/AnimatedLandingPage.js
import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedLandingPage.css';

const AnimatedLandingPage = () => {
  return (
    <motion.div 
      className="animated-landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <motion.img 
        src="/warehouse.jpg" 
        alt="Warehouse" 
        className="landing-image"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2 }}
      />
      <motion.div 
        className="overlay"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <h1>Welcome to Our Site</h1>
        <p>Your gateway to amazing services</p>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedLandingPage;
