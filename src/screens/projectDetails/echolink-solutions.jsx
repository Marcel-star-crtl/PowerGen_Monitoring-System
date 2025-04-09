import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { Blurhash } from 'react-blurhash';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';


const Project0Details = () => {
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
        <div style={{display: 'column'}} className="" >
          <h1>Echolink Solutions - <br/>United States of <br/>America</h1>
          <h2 style={{color: '#ffffff'}}>Secure and efficient electronic data interchange (EDI) solutions.</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section blurhash-wrapper">
          <BlurhashImg src="https://i.postimg.cc/fDhS5PdC/Free-Citylight-Poster-Mockup-3-2048x1536.avif" placeholderColor="#888" />
        </div>
      </div>
      {/* <div className='ulev__details-video section__padding'>
        <div className="video-container">
          <video ref={videoRef} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/0gav5l406hgu1n6ddz5an/Free_Street_Billboard_Mockup_1-2048x1536.avif?rlkey=2eg1izodxc3ddh8w7m9d3n0yz&dl=0" type="video/mp4" />
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
            Echolink Solutions is a technology company specializing in providing secure and efficient electronic data interchange (EDI) solutions. Their goal is to enable seamless communication and collaboration between businesses through the exchange of electronic documents. <br/><br/><br/><br/>
            
            <h1>How Ulevus Rebranded Echolink Solutions:</h1>
            As part of its growth strategy and to better align its brand with its mission and values, Echolink Solutions underwent a comprehensive rebranding process.<br/><br/><br/><br/>
            The primary objectives for rebranding Echolink Solutions were to enhance the brand perception and position itself as a trusted advisor and data exchange software solutions company for businesses that seek to modernize their operations and leverage the power of Data Transfer. Echolink Solutions wanted to differentiate itself from other players, establish consistency, and clearly communicate its mission of empowering other businesses to grow and succeed through fast, secure, and efficient Electronic Data Interchange (EDI) solutions.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/MWZy5FhN/Business-Card-US-2048x1536.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/pR8YL8fG/Color-Pallette-2048x1228.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/L9njKZ4V/Cropped-T-2048x1365.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/z8mK6Bsn/Cropped-T-Shirt-Moc-2048x1365.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section blurhash-wrapper">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/hgQV2x5D/Cropped-T-Shirt-Mockup-2048x1365.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/CSjkg009/dfss-2048x1228.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/hgQV2x5D/Cropped-T-Shirt-Mockup-2048x1365.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/CSjkg009/dfss-2048x1228.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>Rebranding Strategy:</h1>
            The rebranding strategy included redesigning the visual identity with a modern logo that symbolized security and collaboration. A new color palette reflected trust and growth, while typography balanced professionalism and modernity. The Imagery showcased real-world business scenarios, emphasizing seamless document exchange. The brand’s tone of voice was authoritative yet approachable.
          </p>
        </div>
      </div>
      <div>
        {/* <div className='ulev__details-images section__padding'>
          
        </div> */}
        <div className='ulev__details-images section__padding'>
          {/* <div className="image-section">
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/6Wgn95yx/ECHOLINK-SOLUTION-TWITTER-2048x1434.avif" placeholderColor="#888"/>
            </div>
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/VzWqj8HX/es-brand-guidelines-2048x1536.avif" placeholderColor="#888"/>
            </div>
          </div> */}

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/6Wgn95yx/ECHOLINK-SOLUTION-TWITTER-2048x1434.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/VzWqj8HX/es-brand-guidelines-2048x1536.avif" placeholderColor="#888"/>
          </div>

          {/* <div className="image-section">
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/GcMv5jR2/es-brand-guideliness-2048x1536.avif" placeholderColor="#888"/>
            </div>
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/PdyDCMP4/fggdd-2048x1228.avif" placeholderColor="#888"/>
            </div>
          </div> */}

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/GcMv5jR2/es-brand-guideliness-2048x1536.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/PdyDCMP4/fggdd-2048x1228.avif" placeholderColor="#888"/>
          </div>

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/NgPr4f82/fggg-2048x1228.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/gGmRc7kj/Free-Street-Banner-Mockup-1-2048x1366.avif" placeholderColor="#888"/>
          </div>
          {/* <div className="image-section">
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/TRPDgWbX/Free-Street-Billboard-Mockup-1-2048x1536.avif" placeholderColor="#888"/>
            </div>
            <div className="single-image-section">
              <BlurhashImg src="https://i.postimg.cc/sjQG0dK6/Free-Street-Billboard-Mockup-2-2048x1536.avif" placeholderColor="#888"/>
            </div>
          </div> */}

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/TRPDgWbX/Free-Street-Billboard-Mockup-1-2048x1536.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/sjQG0dK6/Free-Street-Billboard-Mockup-2-2048x1536.avif" placeholderColor="#888"/>
          </div>

        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>The End Product:</h1>
            The rebranding of Echolink Solutions successfully positioned the company as a trusted and reliable Electronic Data Interchange partner. The new visual identity and messaging resonated well, leading to improved brand perception. The differentiation highlighted their commitment to security, reliability, and efficiency. Consistent brand representation increased recognition, while the communication of their mission solidified their leadership position in enabling seamless communication and collaboration
            through Electronic Data interchange solutions. <br/>
            Overall, the rebranding revitalized Echolink Solutions, aligning its brand with its mission and values and establishing a strong foundation for future growth.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/ZbGBG7MT/Free-Street-Billboard-Mockup-4-2048x1536.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/pv4F5rXg/ghhhg-2048x1228.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ZbGBG7MT/Free-Street-Billboard-Mockup-4-2048x1536.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/pv4F5rXg/ghhhg-2048x1228.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/X35yfWrX/hjjjg-2048x1228.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ss9QLJ9r/hjjjkk-2048x1228.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/WsNFcJXJ/Landscape-i-Pad-Pro-Space-Gray-with-Cover-Mockup-2048x1707.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/7PrhsC5h/Large-Fence-Banner-Mockup-2048x1365.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/qp1tJM5D/Letter-Head-2048x1228.avif" placeholderColor="#888"/>
          </div>
        </div> */}

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/7PrhsC5h/Large-Fence-Banner-Mockup-2048x1365.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/qp1tJM5D/Letter-Head-2048x1228.avif" placeholderColor="#888"/>
          </div>


      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/9m7zYPFs/phoneeee-2048x1228.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/1948f1xm/SOCIAL-MEDIA-2048x1228.avif" placeholderColor="#888"/>
          </div>
        </div> */}


        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/9m7zYPFs/phoneeee-2048x1228.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/1948f1xm/SOCIAL-MEDIA-2048x1228.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/qrPNMF1r/Tote-Bags-2048x1228.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/TT6rFFvC/eagles1.avif" />
        </div> */}
      </div>
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
        <Link to="/work/Lewa" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/6xx3r19drd73k35g559zx/project4-1.avif?rlkey=uxgakpuor085zmata0cuueoos&dl=0" alt="Featured Image" className="related-image" />
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

export default Project0Details;