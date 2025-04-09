import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';


const Project7Details = () => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      setPlaying(!playing);
      const video = videoRef.current;

      if (!playing || video.ended) {
        video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    }
  };

  const handleVideoEnded = () => {
    setPlaying(false);
  };

  return (
    <div className='ulev_details'>
      <div className="ulev__details-title section__padding">
        <div style={{display: 'column'}}>
          <h1>Alani - Africa</h1>
          <h2>Flawless beauty of mother nature</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/dqbzhmM3/alani10.avif" placeholderColor="#888"/>
        </div>
      </div>

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>CASE REVIEW: Simple yet Captivating</h1>
            This beauty product line was creatively designed to emphasize the flawless beauty of mother nature. We crafted the logo and mixed two natural colors to provide a calm and soothing feeling to everyone who comes across the product.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YM8KdWFD/alani1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/RC9yRSZz/alani11.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/DFK9FgdY/alani12.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/gGJ9Q2qz/alani2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/fDMQ7KV0/alani3.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Ng93GCzZ/alani4.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/HY51zv0b/alani5.avif" placeholderColor="#888"/>
        </div>


        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/D2RKq3G2/alani6.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/vMFsTMMh/alani7.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/WpvLHmSC/alani8.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/JR2wLCPb/alani9.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/ideal-farmers-yought-recognition-awards" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/8zlfjvv19hfoc4uc92owk/project1-1.avif?rlkey=7mjbj0mbxr3rojt3wa45d2qrb&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Ideal Farmers Recognition</h2>
              <p>Brand Identity, Website</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/echolink-solutions" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/28mkwmmxjc81x8ily9u9n/project0-1.avif?rlkey=stwcbb2rez4lzu698o0hbw53d&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Echolink Solutions</h2>
              <p>Brand Identity</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project7Details;