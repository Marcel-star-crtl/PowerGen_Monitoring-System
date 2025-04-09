import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project11Details = () => {
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
          <h1>African Rooted - <br/> Canada</h1>
          <h2 style={{color: '#ffffff'}}>African Rooted seen in the heart of Africa.</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/CFJmd7SC/african1.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>CASE REVIEW:</h1>
            Each design pattern on the material was sketched by hand and assembled to create a unique set of patterns that convey courage, strength, ingenuity, depth, song, dance, hope, and love the founders of African Rooted seen in the heart of Africa.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/51DpH6dr/african10.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/mbdyTry8/african11.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Q8HkCr6s/african12.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/GLVPsSND/african13.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/38c1Fwyd/african2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/3hStTtLY/african3.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/RvLTbd6r/african4.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/QXNqL71F/african5.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Vz8RRpNB/african6.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Tfm0nfT3/african7.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/2CRHt30W/african8.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YkvbqQVg/african9.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/rumi-sir" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/5mhbj05mm6iv0j7idmo0q/project15.avif?rlkey=4vttbfs5ggfevfmmte61xyp1g&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Rusir</h2>
              <p>Brand-Identity-Brand Packaging</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/sontech" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/6jvvcfpuf5pw1ihyyx531/project12.avif?rlkey=2ytmixdosx02puysg0ybz6fug&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Son Technology</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project11Details;