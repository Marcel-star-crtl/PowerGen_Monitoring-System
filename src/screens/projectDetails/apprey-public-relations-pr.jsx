import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10} from './imports';
import play from '../../main_assets/play.png';
import './imports'
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Project2Details = () => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Play the video when the component mounts
    if (videoRef.current) {
      const video = videoRef.current;
      video.play();
      setPlaying(true);
    }
  }, []);

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

  // const handleVideoEnded = () => {
  //   setPlaying(false);
  // };



  const handlePlayPauseSec = () => {
    if (videoRef.current) {
      const video = videoRef.current;

      if (video.paused) {
        video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    }
  };
  
  
  
  

  const handleVideoEnded = (index) => () => {
    const updatedPlaying = [...playing];
    updatedPlaying[index] = false;
    setPlaying(updatedPlaying);
  };


  return (
    <div className='ulev_details'>
      <div className="ulev__details-title section__padding">
        {/* <h1>Ideal Farmers <br/> Youth <br/> Recognition <br/> */}
        
        <div style={{display: 'column'}}>
          <h1>Apprey PR - <br/> Chicago, USA</h1>
          <h2 style={{color: '#ffffff'}}> A Chicago-based public relations agency</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      
      {/* <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <LazyLoad offset={100}>
            <img src="https://dl.dropboxusercontent.com/scl/fi/ilirmjzzvvwffkpyxzfva/BILLBOARD-DESIGN-PRINT.avif?rlkey=gc1ou5m1nv6ynwk4awuejshfm&dl=0" alt="Image 4" />
          </LazyLoad>
        </div>
      </div>; */}




      {/* <div className='ulev__details-video section__padding'>
        <div className='video-container'>
          <LazyLoad offset={100}>
            <video
              ref={videoRef}
              loop
              playsInline
              controls
              width='100%'
              height='600px'
              style={{ objectFit: 'cover' }}
              onPause={handlePlayPauseSec}
            >
              <source src='https://dl.dropboxusercontent.com/scl/fi/a040zlxfkjregvqo1vzka/Sequence-01.mp4?rlkey=lyh9r1gwb226o46i2x1iop04l&dl=0' type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          </LazyLoad>
        </div>
      </div> */}

      <div className='ulev__details-video section__padding'>
        <LazyLoad offset={100}>
          <div className="video-container">
            <video ref={videoRef} controls autoPlay width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/a040zlxfkjregvqo1vzka/Sequence-01.mp4?rlkey=lyh9r1gwb226o46i2x1iop04l&dl=0' type='video/mp4" />
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
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            Apprey PR, a Chicago-based public relations agency, embarked on a brand identity journey to reflect its dedication to elevating clients’ aspirations and achievements. The agency’s mission is to transform clients’ endeavors into celebrated stories and amplify their visibility on both local and global platforms. <br/><br/><br/><br/>
            <h1>Objectives</h1>
            To showcase Apprey PR’s unwavering dedication to its clients and their unique stories through strategically crafted brand identity that portray professionalism, and ultimately position the brand as a reputable and high-tier public relation agency.
          </p>
        </div>
      </div>

      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/FNyKcmxh/Apprey-Billboard-Print.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/JM510x1n/APPREY-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FNyKcmxh/Apprey-Billboard-Print.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/JM510x1n/APPREY-BILLBOARD-PRINT.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/KmcmMTz5/APPREY-BILLBOARD-PRINT-1-1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/QDvNyV4X/Apprey-Billboard-Print-2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/xnDCcqMs/Apprey-Billboard-Print-72f92c1c.avif" placeholderColor="#888"/>
        </div>
        <div className="ulev_morePD section__padding" id="wgpt3">
          <div className="ulev_morePD-contain section__padding">
            <p className='ulev_morePD-other'>
            </p>
            <p className='ulev_morePD-p'>
              <h1>Logo Design</h1>
              The logo was meticulously crafted to embody a client-centric approach. Triangular patterns converged toward a diamond at the core, symbolizing Apprey PR’s focus on elevating clients. The “PR” was emphasized within the name, highlighting the agency’s expertise in public relations.
            </p>
          </div>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/px8Vbx4K/Apprey-Office.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/4XXxQM8V/Apprey-Office-Stationary.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/px8Vbx4K/Apprey-Office.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4XXxQM8V/Apprey-Office-Stationary.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/dvMv9p33/APPREY-PR-IMAGERY.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/YMMH5F1w/Apprey-Social-Media-Post.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/dvMv9p33/APPREY-PR-IMAGERY.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YMMH5F1w/Apprey-Social-Media-Post.avif" placeholderColor="#888"/>
        </div>

      </div>;

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            The chosen brand colors, blue, yellow, and red, were strategically selected to infuse vibrancy and emotion. Red drew attention, blue invoked tranquility, and yellow represented both the agency’s origins and excellent service. These colors harmonized to convey a sense of joy, comfort, and calm.  The typeface was selected to convey professionalism while maintaining an approachable and welcoming feel. <br/><br/>
            The imagery used in the branding showcased clients’ stories and achievements, emphasizing the agency’s transformative role. <br/><br/><br/><br/>
            <h1>Implementation and Rollout</h1>
            The new logo was integrated across all touch-points, including the social media profiles and marketing materials, ensuring a consistent and recognizable brand presence. The selected brand colors were used consistently to maintain visual harmony and reinforce emotional associations. The brand’s messaging focused on the agency’s commitment to transforming clients’ stories into celebrated narratives, highlighting the agency’s expertise in public relations.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/9cfjMj88/Artboard-21.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/W2BRXq2C/Banner-Print.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/9cfjMj88/Artboard-21.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/W2BRXq2C/Banner-Print.avif" placeholderColor="#888"/>
        </div>

        {/* <div className="single-image-section">
          <LazyLoad offset={100}>
            <img src="https://dl.dropboxusercontent.com/scl/fi/ilirmjzzvvwffkpyxzfva/BILLBOARD-DESIGN-PRINT.avif?rlkey=gc1ou5m1nv6ynwk4awuejshfm&dl=0" alt="Image 3" />
          </LazyLoad>
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FFvMQtkx/BILLBOARD-DESIGN-PRINT.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/q0Xfx7WD/DESIGN-SYSTEM.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/dwqbHYYs/Roadside-Banner-Print.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Qh0Rvy8p/Tote-Bag.avif" placeholderColor="#888"/>
          </div>
        </div> */}

          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/dwqbHYYs/Roadside-Banner-Print.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Qh0Rvy8p/Tote-Bag.avif" placeholderColor="#888"/>
          </div>

        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Y7PVNWXx/Brandmark.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/69jPm2Bt/Color-Palette.png" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Y7PVNWXx/Brandmark.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/69jPm2Bt/Color-Palette.png" placeholderColor="#888"/>
        </div>

      </div>;

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>Results and Impact</h1>
              The brand identity of Apprey PR effectively communicated a client-focused commitment, solidifying its position as a reliable partner. This was further reinforced by the establishment of a professional image through its visual elements and messaging. The chosen brand colors not only infused vibrancy and depth but resonated emotionally with the audience. The prominently featured “PR” in the logo showcased the agency’s expertise in public relations, significantly enhancing its credibility within the industry. <br/><br/><br/><br/>
            <h1>Conclusion</h1>
              Apprey PR’s brand identity design successfully communicated the agency’s dedication to clients’ success and its commitment to professional excellence. The logo, color palette, and imagery collectively conveyed a client-centric approach, professionalism, and vibrancy. The brand identity effectively positioned Apprey PR as a transformative force in the field of public relations.
          </p>
        </div>
      </div>
      <div className='ulev__details-images section__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4skSqTR7/Facebook-design.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/vbrNdSGP/Hierachy.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/4fjSXDK0/Logo-Brandmark.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/VfJhQfNM/Logo-Overview.png" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/8DrYZz9g/Star-Elements.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Z4xVQBL2/Twitter-Design.png" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8DrYZz9g/Star-Elements.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Z4xVQBL2/Twitter-Design.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/D77YfdZ7/Type-Face.png" placeholderColor="#888"/>
        </div>
      </div>;
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/eagle-wings" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
                <img src="https://dl.dropboxusercontent.com/scl/fi/vwy8zqtm1v330im9sluin/project14.avif?rlkey=qk0wr8me7kyg1qy26c9sgiw7b&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Eagle Wings Spices</h2>
              <p>Brand Identity - Brand Packaging</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/house-of-sigala" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/j7fe7543io6ykfqytb3tv/project6_1.avif?rlkey=9emo1mrgt2jbgmk5osmyuech5&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>House of Sigala</h2>
              <p>Brand Identity - Brand Package</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project2Details;
