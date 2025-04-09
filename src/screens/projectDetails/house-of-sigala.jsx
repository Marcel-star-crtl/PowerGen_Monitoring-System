import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project13Details = () => {
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
            <h1>House of Sigala (HOS) – <br/> Africa</h1>
        </div>
        <p style={{ marginBottom: "auto" }}>Brand Identity </p>
        
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/NQ9dH4yR/sos1.avif" placeholderColor="#888"/>
        </div>
      </div>
      {/* <div className='ulev__details-video section__padding'>
        <div className="video-container">
          <video ref={videoRef} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/3zad3vwq7pdgae3rd9viz/smoke.7d2ab9144dd6afc4980e.mp4?rlkey=354a7iwejwf1e53s8uvayzdun&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {!playing && (
            <div className="video-overlay" onClick={handlePlayPause}>
              <img src={play} className="img-fluid" alt="video-preview-img" />
            </div>
          )}
        </div>
      </div> */}
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>CASE REVIEW: In-house website design project</h1>
            The House of Sigala website provides you with a sample website wireframe and web design that can be developed for your business to give you an online presence.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/PhyVsNsv/sos2.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/2Cs2FZvM/sos3.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/cxZhPGFc/sos4.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/2Cs2FZvM/sos3.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/cxZhPGFc/sos4.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/D215CwPZ/sos5.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/MqGPWxqP/sos6.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/ideal-farmers-yought-recognition-awards" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
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
            <LazyLoad>
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

export default Project13Details;