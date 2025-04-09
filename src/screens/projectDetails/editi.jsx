import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';
import './imports'

const Project5Details = () => {
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
          <h1>Electronic Data <br/> interchange Technology <br/> Institute (EDITI) - USA</h1>
          <h2>Online education and training platform for integration professionals.</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/y73tsv0R/2-2.avif" placeholderColor="#888"/>
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
            <h1>CASE REVIEW: Identity Branding for Electronic Data Transfer Institute</h1>
            The Electronic Data Interchange and Technology Institute provides online education and training platform for integration professionals. The brand identity included a personalized logo designed specifically for EDITI and reflects the name of the company and its goal to educate IT professionals in system integration and software development.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Vz3yC3z4/2-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/YpcV9Yxs/2ty.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Vz3yC3z4/2-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YpcV9Yxs/2ty.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/mbMvN8D4/3-1-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/y1y22xcr/5-scaled.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/CMM9004M/6-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/ty9KWdH0/8-1-1-scaled.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/CMM9004M/6-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ty9KWdH0/8-1-1-scaled.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/HH3f2Jpr/Copy-of-4-scaled-2.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/8N5xn15t/Copy-of-4-scaled-3.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/HH3f2Jpr/Copy-of-4-scaled-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8N5xn15t/Copy-of-4-scaled-3.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="single-image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/SShwZC2M/7-3-1-scaled.aviff" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Skv3BwYq/7-3-scaled.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/SShwZC2M/7-3-1-scaled.aviff" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Skv3BwYq/7-3-scaled.avif" placeholderColor="#888"/>
        </div>

      </div>
        
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/purpose" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/j7fe7543io6ykfqytb3tv/project6_1.avif?rlkey=9emo1mrgt2jbgmk5osmyuech5&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Purpose</h2>
              <p>Brand Identity, Brand Possitioning</p>
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

export default Project5Details;