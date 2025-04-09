import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project6Details = () => {
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
          <h1>Purpose - Africa</h1>
          <h2 style={{color: '#ffffff'}}>Secure and efficient electronic data interchange (EDI) solutions.</h2>
        </div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
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
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/xnsLfLGG/purpose4.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="single-image-section">
          <LazyLoad offset={100}>
            <img src="https://dl.dropboxusercontent.com/scl/fi/0z5visxurkrxnug4egtwx/purpose2.avif?rlkey=51ma6w4lhvn6q6s667tns0weh&dl=0" alt="Image 4" />
          </LazyLoad>
        </div> */}
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/WT4JHhRd/purpose2.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/gGn8nr4C/purpose3.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/WT4JHhRd/purpose2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/gGn8nr4C/purpose3.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/silicon-mountain-conference-2023" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/szwv1pc931ml0yw3tzxq0/project3-1.avif?rlkey=6p31l2k3k5gs5rqdywt7kq6fg&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Silicon Mountain Conference</h2>
              <p>Brand Identity, Design Implementation</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/apprey-public-relations-pr" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/27nd110i4piyoughuohk1/project2-1.avif?rlkey=c9v6j2yf18bw8ujeasmaru2od&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Apprey Public Relations</h2>
              <p>Brand Identity, Design Implementation</p>
              <p>France - Europe</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project6Details;