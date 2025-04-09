import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail10, detail9 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project14Details = () => {
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
            <h1>Eagle Wings Spices & Foods – <br/> Cameroon</h1>
            <h2>Creation of spices that enable the modern family to spend less time in the kitchen.</h2>
        </div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ZTDvbDXk/eagles7.avif" placeholderColor="#888"/>
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
            <h1>CASE REVIEW: Rebranded and Uplifted</h1>
            Eagle Wings Spices and Foods was established in Cameroon in 2005, and the first business in Cameroon to create Peppers with ingredients in a bottle called “Spice Up”.  We redesigned their logo and spice packages to meet their goal of modernizing their brand and optimizing their social media presence. The purpose of their brand is to create spices that enable the modern family to spend less time in the kitchen and more time together. 
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/TT6rFFvC/eagles1.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/jRt7Zfy1/eagles2.avif" placeholderColor="#888"/>
          </div>
        </div> */}


        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/TT6rFFvC/eagles1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/jRt7Zfy1/eagles2.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/3KwDHHSC/eagles3.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Dv8s1K1y/eagles4.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/gzQhDBKy/eagles5.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Dv8s1K1y/eagles4.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/gzQhDBKy/eagles5.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/3YMp0VNY/eagles6.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/eagle-wings" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/vwy8zqtm1v330im9sluin/project14.avif?rlkey=qk0wr8me7kyg1qy26c9sgiw7b&dl=0" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Eagle Wings Spices</h2>
              <p>Brand Identity - Brand Packaging</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/Lewa" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/6xx3r19drd73k35g559zx/project4-1.avif?rlkey=uxgakpuor085zmata0cuueoos&dl=0" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>LEWA</h2>
              <p>Brand-I dentity, Naming, Design Implemention</p>
              <p>Cameroon-Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project14Details;