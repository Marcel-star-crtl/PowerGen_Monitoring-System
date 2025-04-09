import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project15Details = () => {
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
          <h1>RuSir – Africa</h1>
        </div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/3KzdVRZT/rusir1.avif" placeholderColor="#888"/>
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
            <h1>CASE REVIEW: Royal and Elegant </h1>
            Enter the world of royalty and elegance. Ulevus gave dark green a vibrant look by infusing a touch of golden peach, resulting in a lush and luxurious branding. 
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/k71VNw6D/rusir10.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/1PnK8ndp/rusir2.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/k71VNw6D/rusir10.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/1PnK8ndp/rusir2.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/qpMhCW79/rusir3.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Hdt8nTTw/rusir5.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/VYvC22Qj/rusir4.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/LS0T4Bx9/rusir6.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/D2vg0CVZ/rusir7.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/LS0T4Bx9/rusir6.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/D2vg0CVZ/rusir7.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/YpdxW1kx/rusir8.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/8177ZWM4/rusir9.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YpdxW1kx/rusir8.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8177ZWM4/rusir9.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="single-image-section">
          <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/t541b4ne60d9d633fnggr/rusir10.avif?rlkey=b36bsx5fwxvh5lvzsru9gisg8&dl=0" alt="Image 10" />
          </LazyLoad>
        </div> */}
      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/silicon-mountain-conference-2023" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
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
            <LazyLoad>
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

export default Project15Details;