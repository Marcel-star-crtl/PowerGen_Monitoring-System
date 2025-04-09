import React from 'react';
import './article3.css';
import Slider from 'react-slick';
import { useMediaQuery } from 'react-responsive';

const Article3 = ({
  bio
}) => {

  return (
    <div className='ulev__blog-container_article'>
      <div>
        <p className='life'>
          {bio}</p>
      </div>
    </div>
  );
};

export default Article3;
