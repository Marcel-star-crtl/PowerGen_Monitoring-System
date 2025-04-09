import React from 'react';
import { Link } from 'react-router-dom';
import './projectCards.css';

const ProjectCards = ({ to, imageSrc, title, description, details, featured }) => {
  return (
    <Link to={to} className={`project-card ${featured ? 'featured' : ''}`}>
      <div className="featured-image">
        <img src={imageSrc} alt={title} />
        <div className="overlay">
          <h2 className={featured ? 'featured-title' : ''}>{title}</h2>
          <p className={featured ? 'featured-description' : ''}>{description}</p>
          {details && <p>{details}</p>}
        </div>
      </div>
    </Link>
  );
};

export default ProjectCards;

