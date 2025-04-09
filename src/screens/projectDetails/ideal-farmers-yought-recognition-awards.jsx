import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project1Details = () => {
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
        <h1>Ideal Farmers Youth <br/> Recognition Awards - <br/> Cameroon</h1>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/NGh5B7hB/Artboard-19-2x.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            IDEAL FARMERS YOUTH RECOGNITION AWARD (IFYRA) is an initiative brought forth by IDEAL FARMERS LTD. IFYRA comes in to identify, recognize, motivate and promote youths in the agricultural sector. This is an event which is carried out annually. This will keep the youths focused and will push them to put more energy into being able to get on this podium. This will make them proud to be farmers and open them to a lot of investment and marketing opportunities.<br/><br/><br/><br/>
            <h1>Challenge:</h1>
              Ideal farmers needed to optimize their brand identity to attract, engage, and integrate more young individuals into the agricultural profession, change the community’s interpretation of farming, garner more investors within the agricultural sector, and truly showcase their enthusiasm in celebrating young farmers all over Cameroon, Africa. <br/>
            <h1>Brand Strategy:</h1>
              Ulevus designed the IFYRA brand identity by crafting the logo, color palette, typography, and other design elements representing a youthful, forward-thinking, and dynamic agricultural organization. <br/> 
              The hand-sketched IFYRA logo elegantly embodies nurturing, growth, reward, and elegance to emphasize the significance of agriculture in nourishing life and promoting a renewed appreciation for the field.<br/>
              The vibrant green hues speak to growth, new life, and the essence of nature. Ulevus’ inclusion of plant veins in the design pattern conveys efficiency, energy, nutrients, and innovation that the younger generation brings to the agricultural sector.<br/>
              The tone of voice instilled in the IFYRA Brand Identity project resonates with enthusiasm and a spirit of celebration.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/BJhbXGWh/Billboard-Prints-1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/7wnfr2Kr/Billboard-Prints-2-scaled.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/7wnfr2Kr/Billboard-Prints-2-scaled.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/fWhT6zXb/Ifyra-Backdrop.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/SmQjSxP2/Ifyra-Icongraphy-2.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/6tXyP0Lh/Ifyra-Logo.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/m4KcYRPJ/Ifyra-Logo-Design.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Ykgv8Vg9/Ifyra-Logo-Design-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/QXwMJkd1/Ifyra-Logo-Variations.avif" placeholderColor="#888"/>
        </div>

      </div>

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>Conclusion:</h1>
              The overall goal of the project is to convey the great work of IFYRA and increase its reach on all social media platforms, shift perceptions about agriculture among youth, portray it as a dynamic and valued profession, and align with the mission of integrating more young individuals into the sector.
          </p>
        </div>
      </div>
      <div>
        <div className='ulev__details-images section__padding'>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Ch8xPBRt/Ifyra-Poster-Print.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/MxkTcD48/Ifyra-Social-Medi-Design.avif" placeholderColor="#888"/>
          </div>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/CYjKb8Tn/Ifyra-Social-Medi-Design-2.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Tff30Pf7/Ifyra-story-post.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/wg2TGdB6/Ifyra-Street-Billboard-Print-1.avif" placeholderColor="#888"/>
          </div>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/mTr2x6c7/Ifyra-Street-Billboard-Print-2-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/7qQPqM7d/Ifyra-Street-Billboard-Print-scaled.avif" placeholderColor="#888"/>
          </div>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/LHcH19xV/Ifyra-Street-poster-Print-scaled.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/M61z0C4J/Ifyra-Tote-Bag-3-scaled.avif" placeholderColor="#888"/>
          </div>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/SQqkgZF2/Ifyra-Twitter.avif" placeholderColor="#888"/>
          </div>
        </div>
      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/rumi-sir" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
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
            <LazyLoad offset={100}>
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

export default Project1Details;