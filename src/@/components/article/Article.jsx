import React from 'react';
import './article.css';
import Slider from 'react-slick';
import { useMediaQuery } from 'react-responsive';

const Article = ({
  photos,
  title,
  text,
  email,
  hobbies,
  favoriteBooks,
  favoriteMovie,
  aspiration,
  showDetailsInfo,
  sliderSettings,
  bio,
  moreBio,
  moreBio2,
  name
}) => {
  const displayPhoto = photos && photos.length > 0 ? photos[0] : null;

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isNotMobile = useMediaQuery({ minWidth: 769 });

  return (
    <div className='ulev__blog-container_article'>
      <div className='ulev__blog-container_article-content'>
        {sliderSettings && (
          <Slider {...sliderSettings}>
            {photos && photos.map((photo, index) => (
              <img key={index} src={photo} alt={`Team Member ${index + 1}`} className="slider-image" />
            ))}
          </Slider>
        )}
        <div className='details'>
          <h3 className='title'>{name}</h3>
          <h5 className='text'>{text}</h5>
        </div>
        {isNotMobile && moreBio && <p className='more'>{moreBio}</p>}
        <p className='email'>{email}</p>
        
      </div>
    </div>
  );
};

export default Article;
