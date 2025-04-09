import React from 'react';
import './article4.css';
import { useMediaQuery } from 'react-responsive';

const Article4 = ({
  photos,
  email,
  moreBio,
  moreBio2,
}) => {
  const displayPhoto = photos && photos.length > 0 ? photos[0] : null;

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isNotMobile = useMediaQuery({ minWidth: 769 });

  return (
    <div className='ulev__blog-container_article'>
      <div className='ulev__blog-container_article-content'>
        {/* {isNotMobile && moreBio && <p className='more'>{moreBio}</p>}
        {isNotMobile && moreBio && <p className='more'>{moreBio2}</p>} */}
        {<p className='more'>{moreBio}</p>}
        {/* {<p className='more'>{moreBio2}</p>} */}
        <p className='email'>{email}</p>
      </div>
    </div>
  );
};

export default Article4;
