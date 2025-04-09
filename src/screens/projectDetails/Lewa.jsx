import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10} from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';
import './imports'

const Lewa = () => {
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
          <h1>Lewa - Cameroon, <br/> Africa</h1>
          <h2> A new and fun way to teach and learn</h2>
        </div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Km5chh6R/Artboard.avif" placeholderColor="#888"/>
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
      {/* <div className="ulev__details-info">
        <p>Brand Identity <br/> website</p>
        <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
        <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
      </div> */}
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/sV9jydbM/Free-Coffee-Cups-Mockup-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/QsnWv1pR/Free-Drop-Down-Hanging-Banner-Mockup-scaled.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/sV9jydbM/Free-Coffee-Cups-Mockup-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/QsnWv1pR/Free-Drop-Down-Hanging-Banner-Mockup-scaled.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/19H8Bqm7/Bill-Borad-scaled.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="single-image-section">
          <LazyLoad offset={100}>
            <img src="https://dl.dropboxusercontent.com/scl/fi/pjirs6bc9vg8n5k08c3pa/Business-Card-Final-1-scaled.avif?rlkey=75mkv8e8hnpim9o3pe26sclv0&dl=0" alt="Image 3" />
          </LazyLoad>
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/3YvW66rv/Business-Card-Final-1-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/PXSdpbXh/Free-Billboard-Mockup-scaled.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/KZFKtN2g/LEWA-BANNER-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/2kr5B8nd/Free-T-Shirt-Mockup-2-scaled.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/KZFKtN2g/LEWA-BANNER-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/2kr5B8nd/Free-T-Shirt-Mockup-2-scaled.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/FN8sVxjH/hj.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Kxkgbjf4/image-from-rawpixel-id-3394146-original-scaled.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FN8sVxjH/hj.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Kxkgbjf4/image-from-rawpixel-id-3394146-original-scaled.avif" placeholderColor="#888"/>
        </div>

      </div>


      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>Ulevus Design Approach for Lewa’s Brand Identity:</h1>
            The objective of Lewa’s brand identity design is to establish Lewa as a reliable and reputable online education platform that educators and learners can trust. The logo was designed to incorporate elements that symbolizes education, transformation, and connectivity through the utilization of vibrant and uplifting colors to convey positive energy. The visual style featured diverse and relatable imagery, showcasing learners and educators engaging in transformative learning experiences.
          </p>
        </div>
      </div>

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>The End Product:</h1>
            The brand identity design successfully captured Lewa’s mission to provide accessible education and positions them as an innovative and trustworthy education platform. The consistent implementation of the brand identity across various touch-points contributed to enhanced brand perception and increased engagement from learners and educators.
          </p>
        </div>
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/y1pk4CSF/Large-Banner-Mockup-scaled.avif" placeholderColor="#888"/>
          {/* <img src="https://dl.dropboxusercontent.com/scl/fi/ywmhwclhgx1yrpsm2mk2m/LEWA.avif?rlkey=5tbysyf6zxg88tgqwfo75mtqo&dl=0" alt="Image 2" /> */}
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/L2cg8SQD/Lewa-Brand-Guidelines-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/tq4YM47q/Lewa-Color-Code.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/xYqXG8Wg/LEWA-IMAGERY-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/q0Yz10rr/LEWA-SOCIAL-MEDIA-DESIGNS-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/y1D7RgkZ/Logo-on-wall.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/8DFCJ360/mb-aml-03.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/4G2d3Zmc/mb-aml4-2.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8DFCJ360/mb-aml-03.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4G2d3Zmc/mb-aml4-2.avif" placeholderColor="#888"/>
        </div>



        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/wqMjk4b3/Mockup-2-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4Xvy4994/Twitter-Posted-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/T22pgyTV/Lewa-Typography.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/PXQCCbnf/Lewa-Typography-2.png" placeholderColor="#888"/>
        </div>
        {/* <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Km5chh6R/Artboard.avif" placeholderColor="#888"/>
        </div> */}
      </div>

      {/* <div className='ulev__details-images section__padding'>
        
      </div> */}
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/ulevus-brand-book-version-1-0" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/p6885dgvrid8oruat3ijk/project9-2.avif?rlkey=qzsdg4g9wjabswg8rvvxihfer&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Ulevus Brand Book</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/alani" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/x3mrh9tgq5nzeecjx4wz7/project7-1.avif?rlkey=mecbj8k1lgxp17751xyirzq4o&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Alani </h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Lewa;