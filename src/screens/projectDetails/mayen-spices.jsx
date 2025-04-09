// import React, { useState, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import './projectDetails.css';
// import { detail9, detail10 } from './imports';
// import play from '../../main_assets/play.png';
// import LazyLoad from 'react-lazyload';

// const Project8Details = () => {
//   const [playing, setPlaying] = useState(false);
//   const videoRef = useRef(null);

//   const handlePlayPause = () => {
//     if (videoRef.current) {
//       setPlaying(!playing);
//       const video = videoRef.current;

//       if (!playing || video.ended) {
//         video.play();
//         setPlaying(true);
//       } else {
//         video.pause();
//         setPlaying(false);
//       }
//     }
//   };

//   const handleVideoEnded = () => {
//     setPlaying(false);
//   };

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'column'}}>
//           <h1>Mayen Spices & Foods – <br/> Cameroon</h1>
//           <h2>Flawless beauty of mother nature</h2></div>
//         <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
//       </div>

//       <div className='ulev__details-images section__padding'>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/sz0ssXbF/mayen1.avif" alt="Image 4" />
//           </LazyLoad>
//         </div>
//       </div>
//       {/* <div className='ulev__details-video section__padding'>
//         <div className="video-container">
//           <video ref={videoRef} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
//             <source src="https://dl.dropboxusercontent.com/scl/fi/3zad3vwq7pdgae3rd9viz/smoke.7d2ab9144dd6afc4980e.mp4?rlkey=354a7iwejwf1e53s8uvayzdun&dl=0" type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//           {!playing && (
//             <div className="video-overlay" onClick={handlePlayPause}>
//               <img src={play} className="img-fluid" alt="video-preview-img" />
//             </div>
//           )}
//         </div>
//       </div> */}
//       {/* <div class="body-text">
//         <h1>Smoth & Technicals</h1>
//         <p>Two multidimensional grey tones – a soothing ‘Rocky Grey’ and a stark ‘Metallic Grey’ – are the cornerstone of the Galaxy’s color palette, working in tandem to project a feeling of clean, stress-free technology. They work in brilliant contrast with the highlight color ‘Vibrant Wave Blue’, which captures a sense of high-tech, imaginative breakthroughs.</p>
//       </div> */}
//       <div className="ulev_morePD section__padding" id="wgpt3">
//         <div className="ulev_morePD-contain section__padding">
//           <p className='ulev_morePD-other'>
//           </p>
//           <p className='ulev_morePD-p'>
//             <h1>CASE REVIEW: Formed from Conception of Idea.</h1>
//             The brand identity for Mayen Spices & Foods was created solely from the business owner’s idea. The logo was hand sketched to provide a unique identity for the product line.  The vibrant color scheme was precisely selected to illuminate the beauty of the product and grab the attention of the onlooker on store shelves and online. The presentation included billboard mockups, social media mood boards, and merchandise.
//           </p>
//         </div>
//       </div>

//       <div className='ulev__details-images section__padding'>
//         <LazyLoad>
//           <div className="image-section">
//             <img src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" alt="Image 1" />
//             <img src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" alt="Image 2" />
//           </div>
//         </LazyLoad>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/8N4ygFnM/mayen14.avif" alt="Image 3" />
//           </LazyLoad>
//         </div>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/cZQ9TkRD/mayen15.avif" alt="Image 4" />
//           </LazyLoad>
//         </div>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/0xgXY1wM/mayen16.avif" alt="Image 5" />
//           </LazyLoad>
//         </div>
//         <LazyLoad>
//           <div className="image-section">
//             <img src="https://i.postimg.cc/cxjSm9f1/mayen2.avif" alt="Image 6" />
//             <img src="https://i.postimg.cc/9cjcKnKr/mayen3.avif" alt="Image 7" />
//           </div>
//         </LazyLoad>
//         <LazyLoad offset={100}>
//           <div className="image-section">
//             <img src="https://i.postimg.cc/ss5rYJxy/mayen4.avif" alt="Image 8" />
//             <img src="https://i.postimg.cc/csx048sW/mayen5.avif" alt="Image 9" />
//           </div>
//         </LazyLoad>



//         <LazyLoad>
//           <div className="image-section">
//             <img src="https://i.postimg.cc/vQ0M1HBV/mayen6.avif" alt="Image 10" />
//             <img src="https://i.postimg.cc/VzBz8FP4/mayen7.avif" alt="Image 11" />
//           </div>
//         </LazyLoad>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/TGzx5sRC/mayen8.avif" alt="Image 12" />
//           </LazyLoad>
//         </div>
//         <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://i.postimg.cc/ysyG6pWJ/mayen9.avif" alt="Image 13" />
//           </LazyLoad>
//         </div>
//         {/* <div className="single-image-section">
//           <LazyLoad>
//             <img src="https://dl.dropboxusercontent.com/scl/fi/636sbzr2husqglr01kis3/mayen14.avif?rlkey=zivnxocuq3c9bbjrjv1jphbmg&dl=0" alt="Image 14" />
//           </LazyLoad>
//         </div> */}
//         <LazyLoad>
//           <div className="image-section">
//             <img src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" alt="Image 15" />
//             <img src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" alt="Image 16" />
//           </div>
//         </LazyLoad>
//       </div>
//       {/* <div className='ulev__details-images section__padding'>
        
//       </div> */}
//       <div className="related-container section__padding">
//         <h1 className='related'>Other Projects</h1>
//         <Link to="/sontech" className="related-card">
//           <div className="related-image-container">
//             <LazyLoad offset={100}>
//               <img src="https://dl.dropboxusercontent.com/scl/fi/6jvvcfpuf5pw1ihyyx531/project12.avif?rlkey=2ytmixdosx02puysg0ybz6fug&dl=0" alt="Featured Image" className="related-image" />
//             </LazyLoad>
//             <div className="overlay">
//               <h2>Son Technology</h2>
//               <p>Brand Identity - Brand Package</p>
//               <p>Cameroon - Africa</p>
//             </div>
//           </div>
//         </Link>
//         <Link to="/african-rooted" className="related-card">
//           <div className="related-image-container">
//             <LazyLoad>
//               <img src="https://dl.dropboxusercontent.com/scl/fi/sqm28jdeo5m0a80txipen/project11.avif?rlkey=0at4nbaada0xlmcuha9ti6lyo&dl=0" alt="Featured Image" className="related-image" />
//             </LazyLoad>
//             <div className="overlay">
//               <h2>African Rooted</h2>
//               <p>Brand Identity - Brand Package</p>
//               <p>Cameroon - Africa</p>
//             </div>
//           </div>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Project8Details;










import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import Image from '../../@/components/Image'
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const IMG_SRC = "https://i.postimg.cc/sz0ssXbF/mayen1.avif";

const Project8Details = () => {
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
          <h1>Mayen Spices & Foods – <br/> Cameroon</h1>
          <h2>Flawless beauty of mother nature</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section blurhash-wrapper">
          {/* <Image src={IMG_SRC} /> */}
          <BlurhashImg src={IMG_SRC} placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'>
          </p>
          <p className='ulev_morePD-p'>
            <h1>CASE REVIEW: Formed from Conception of Idea.</h1>
            The brand identity for Mayen Spices & Foods was created solely from the business owner’s idea. The logo was hand sketched to provide a unique identity for the product line.  The vibrant color scheme was precisely selected to illuminate the beauty of the product and grab the attention of the onlooker on store shelves and online. The presentation included billboard mockups, social media mood boards, and merchandise.
          </p>
        </div>
      </div>

      <div className='ulev__details-images section__padding'>
          <div className="image-section">
            <BlurhashImg src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" placeholderColor="#888"/>
            <BlurhashImg src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" placeholderColor="#888"/>
          </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8N4ygFnM/mayen14.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/cZQ9TkRD/mayen15.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <LazyLoad>
            <BlurhashImg src="https://i.postimg.cc/0xgXY1wM/mayen16.avif" placeholderColor="#888"/>
          </LazyLoad>
        </div>
        <LazyLoad>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/cxjSm9f1/mayen2.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/9cjcKnKr/mayen3.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/cxjSm9f1/mayen2.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/9cjcKnKr/mayen3.avif" placeholderColor="#888"/>
        </div>

        </LazyLoad>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/ss5rYJxy/mayen4.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/csx048sW/mayen5.avif" placeholderColor="#888"/>
          </div>
        </div> */}

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ss5rYJxy/mayen4.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/csx048sW/mayen5.avif" placeholderColor="#888"/>
        </div>

        <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/vQ0M1HBV/mayen6.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/VzBz8FP4/mayen7.avif" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/TGzx5sRC/mayen8.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ysyG6pWJ/mayen9.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" placeholderColor="#888"/>
          </div>
        </div> */}


        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" placeholderColor="#888"/>
        </div>

      </div>
      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
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
        <Link to="/work/african-rooted" className="related-card">
          <div className="related-image-container">
            <LazyLoad>
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

export default Project8Details;