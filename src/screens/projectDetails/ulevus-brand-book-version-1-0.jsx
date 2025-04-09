import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10, } from './imports';
import brandbook from '../../main_assets/brandbook.jpg';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project9Details = () => {
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
          <h1>Ulevus Brand Book <br/>(Version 1.0)</h1>
          <h2>Ulevus Brand Guidelines Version 1.0</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>
      {/* <Link to="/project9Details" className="home_project-cards" >
        <div className="home_project-image" >
          <img src={brandbook} alt="Featured Image" />
          <div className="home_overlay">
            <h2>Ulevus Brand Book (Version 1.0) </h2>
            <p>Brand Identity, website</p>
            <p>Kenya - Africa</p>
          </div>
        </div>
      </Link> */}
      <div className='ulev__details-video section__padding'>
        <LazyLoad offset={100}>
          <div className="video-container">
            <video ref={videoRef} controls autoPlay width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/09dg558gscipi5bqrs75i/brand_vid.mp4?rlkey=7gw9it2ewmsqgtd840t61g7xc&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* {!playing && (
              <div className="video-overlay" onClick={handlePlayPause}>
                <img src={play} className="img-fluid" alt="video-preview-img" />
              </div>
            )} */}
            {/* <iframe
              width="100%"
              height="600px"
              src="https://www.youtube.com/embed/t9SO21GB1YI?autoplay=1&mute=1&loop=1&modestbranding=1&showinfo=0&rel=0"
              title="Ulevus brand book"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe> */}
          </div>
        </LazyLoad>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Embark on a visual journey with Ulevus, where our commitment lies in showcasing brands through minimalistic yet captivating designs that transcend the ordinary, bringing forth unique distinction and prestige.</h1>
              Our motto, “Building Brands that Cannot Be Ignored,” isn’t just a buzzword or catchy phrase but an ethos embedded in every facet of our designs, brand book, and communication with internal and external partners.<br/><br/>
              Creating the Ulevus brand book was a profound endeavor that surpassed the mixture of logos, color palettes, and typography. No, it was a tapestry weaving together our identity as a company – a symbol of unity, elegance, originality, thoughtfulness, creativity, and confidence.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
        {/* <div className="ulev_morePD-text">
        </div> */}
      </div>
     
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/BshdsQk6/brand5.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/jsVp9g94/brand1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/hg4HH7C6/brand2.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              As an African-owned Design and Communications company, we are dedicated to delivering top-tier design services only. Recognizing a blossoming era of beauty and productivity in African businesses globally and a lack of corresponding creativity and innovation, Ulevus bridges this transformation gap through designs that exude elegance and luxury.<br/><br/>
              Our brand book eliminates miscommunication, misrepresentation, and inconsistency across all brand touchpoints, enabling us to effectively communicate our identity as a company to strengthen credibility, enhance morale, and fortify loyalty with our esteemed team and clients. Beyond this, it is a wellspring of inspiration for emerging creatives, showcasing our pride in our hard work and mission to craft extraordinary brands.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/SyWBpLbF/brand7.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/jqjmNGwt/brand4.avif" placeholderColor="#888"/>  
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/7wfjLrrN/brand8.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/L2wwYQHF/brand9.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Td0BKRPt/brand3.avif" placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
            The Ulevus brand book is a testament to the fact that we elevate brands, revealing the inherent value we offer end-users. It stands tall, echoing our commitment to building brands that not only survive but thrive – just as we’ve accomplished for Ulevus and are poised to do for many more.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>
      {/* <div className="ulev__details-info">
        <p>Brand Identity <br/> website</p>
        <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
        <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
      </div> */}
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/purpose" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/j7fe7543io6ykfqytb3tv/project6_1.avif?rlkey=9emo1mrgt2jbgmk5osmyuech5&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Purpose</h2>
              <p>Brand Identity, Brand Possitioning</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/editi" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
              <img src="https://dl.dropboxusercontent.com/scl/fi/ns0c1bcowme3rbmg398wn/project5-1.avif?rlkey=b5xzmzok842nsay9aijt7n6jx&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Electronic Data interchange Technology Institute</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project9Details;