import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10} from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import './imports'
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project3Details = () => {
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
        <h1>Silicon Mountain <br/> Conference 2023, <br/> Cameroon, Africa</h1>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FhgQS20y/SMCON24-NIGHT-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
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
            <h1>Background:</h1>
            The Silicon Mountain Conference, termed SMCON, is the biggest annual technology conference in the country, Cameroon, West Africa. Silicon Mountain is a technology ecosystem where all stakeholders connect, collaborate, innovate, thrive, support, and develop high-impact solutions and ventures. The 2023 Silicon Mountain Conference theme, known as SMCON23, is “It Takes a Village to Raise Champions.” The SMCON23’s theme illustrates all stakeholders’ – in the country and the diaspora – active engagement in developing and proliferating a robust technological innovation and entrepreneurship ecosystem.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Pt9vwpWv/BRAND-COLOR.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/J1GB0ckW/BRAND-COLOR-2.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Pt9vwpWv/BRAND-COLOR.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/J1GB0ckW/BRAND-COLOR-2.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Y2prGMsm/SMCOM24-SOCIAL-MEDIA-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4JkTHXKN/SMCOM24-SOCIAL-MEDIA-DESIGN-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/KGsbzBBC/SMCON-24-LETTER-DESIGN.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/dqrZGQ4W/SMCON-Banner.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/8k1vp8dZ/SMCON-WORK-ON-GROUND.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/dqrZGQ4W/SMCON-Banner.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8k1vp8dZ/SMCON-WORK-ON-GROUND.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Qsb56tsw/SMCON-WORK-ON-GROUND-2.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/x9dPGmz6/SMCON-X-DESIGN.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Qsb56tsw/SMCON-WORK-ON-GROUND-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/x9dPGmz6/SMCON-X-DESIGN.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>Objectives:</h1>
            art of the Silicon Mountain ecosystem, Ulevus crafted a brand identity that showcased the spirit of SMCON23, “It Takes a Village to Raise Champions.” Starting with the logo, the Ulevus design team crafted the SMCON23 logo that conveys strength, leadership, and the essence of collaboration.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/BJ3rJMRX/SMCON2023-COLOR-12.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/PhG8fDfB/SMCON23-LOGO-VARAIATION.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/BJ3rJMRX/SMCON2023-COLOR-12.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/PhG8fDfB/SMCON23-LOGO-VARAIATION.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/mRQ1Prth/SMCON23-PATTERN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/nZZcwGhc/SMCON24-FACEBOOK-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/HdvYnG4V/SMCON24-BACKDROP-BANNER-DESIGN.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/rc3c2G8r/SMCON24-BACKDROP-DESIGN.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/PdkjPtvf/SMCON24-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/rc3c2G8r/SMCON24-BACKDROP-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/PdkjPtvf/SMCON24-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/KFZx5c01/SMCON24-Feather-Banner.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/LHL2xJd1/SMCON24-LOGO-LOOKUP.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/KFZx5c01/SMCON24-Feather-Banner.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/LHL2xJd1/SMCON24-LOGO-LOOKUP.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <p className='ulev_morePD-p'>
            <h1>Ulevus Brand Identity Strategy for SMCON23:</h1>
            <h1>Logo Design:</h1>
            To embody the theme of leadership and unity, the “M” and “3” in the SMCON23 logo were artfully crafted to mirror Silicon Mountain’s emblem, an elephant. The Elephant representing “M” in SMCON23 symbolizes leaders in the ecosystem guiding and leading the path to greatness for the emerging generation within the community. The upcoming generation is represented by the “3” at the end of the SMCON23, walking the cleared path ahead and innovating creative solutions to inspire and sprout new generations of great minds in Cameroon. In their natural habitat, elephants move as cohesive units, emphasizing the principle that unity is strength.</p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/SSj0wR3d/SMCON24-MARKETING-DESIGN.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/VmtwfS6H/SMCON24-MARKETING-DESIGN-3.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/SSj0wR3d/SMCON24-MARKETING-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/VmtwfS6H/SMCON24-MARKETING-DESIGN-3.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/6BhDqCNz/SMCON24-WRISTBAND.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/HYKGHHCg/SMCON24-SOCIAL-MEDIA-DESIGN.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/D2v3PBct/SMCON24-SOCIAL-MEDIA-DESINS.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/b8s85VjP/SMCON24-Social-Media-Icons.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/D2v3PBct/SMCON24-SOCIAL-MEDIA-DESINS.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/b8s85VjP/SMCON24-Social-Media-Icons.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/GRSnvPT5/SMCON24-SPEAKER-BADGE.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/WjFL8DMb/SMCON24-STREET-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/GRSnvPT5/SMCON24-SPEAKER-BADGE.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/WjFL8DMb/SMCON24-STREET-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <p className='ulev_morePD-p'>
            <h1>Color Palette:</h1>
              The chosen brand colors, Purple, red, and yellow, were selected to depict vibrancy, excitement, unity, and innovation.</p>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <p className='ulev_morePD-p'>
            <h1>pattern:</h1>
              The pattern embodies the tenacity of Silicon Mountain’s innovators, with the stars illustrating the community’s vibrant potential. Buea’s mountain, recognized as the tallest in West Africa, stands not just as a geographical marvel but also as a testament to endurance and resilience for many generations. Mirroring this, Silicon Mountain’s emblematic elephant symbolizes innovators’ unwavering determination to ascend, regardless of their challenges.</p>
        </div>
      </div> 
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/jKrQgmfw/SMCON24-TOTE-BAG-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/fDfHfZgR/SMCON24-TOTE-BAG-DESIGN-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/q4Jc0Kjp/SMCON24-TOTE-BAG-PURPLE-DESIGN.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/TT2tkSZq/SMCON24-TSHIRT-DESIGN.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/5bbg0TNd/SMCON24-Wall-Banner.avif" placeholderColor="#888"/>
          </div>
        </div> */}


        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/TT2tkSZq/SMCON24-TSHIRT-DESIGN.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/5bbg0TNd/SMCON24-Wall-Banner.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/VmKqNNVn/SMCON24-WATER-BOTTLE.avif" placeholderColor="#888"/>
        </div>
      </div>

      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/mayen-spices" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/hhjfagkn550gs6xs9ldaa/project8-2.avif?rlkey=wsrbnohya84mjtai6hfjc50oy&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Mayen Spices & Foods</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/african-rooted" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/sqm28jdeo5m0a80txipen/project11.avif?rlkey=0at4nbaada0xlmcuha9ti6lyo&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>African Rooted</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project3Details;
