// import React, { useState, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import './projectDetails.css';
// import smoke from '../../main_assets/vids/smoke.mp4';
// import { detail1, detail2, detail3, detail4, detail5, detail6, detail7, detail8, detail9, detail10, detail11 } from './imports';
// import play from '../../main_assets/play.png'

// const Project10Details = () => {
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
//           <h1>Mayen Spices & Foods – <br/>Cameroon</h1>
//           <h2 style={{color: '#ffffff'}}>Flawless beauty of mother nature</h2></div>
//         <p>Brand Identity <br/> website</p>
        
//       </div>
//       <div className='ulev__details-video section__padding'>
//         <div className="video-container">
//           <video ref={videoRef} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
//             <source src={smoke} type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//           {!playing && (
//             <div className="video-overlay" onClick={handlePlayPause}>
//               <img src={play} className="img-fluid" alt="video-preview-img" />
//             </div>
//           )}
//         </div>
//       </div>
//       <div className="ulev__details-info">
//         <p>Brand Identity <br/> website</p>
//         <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
//         <p>We listen to your vision for your business and create targeted strategies through user-driven research, insight, imagination, and technology to deliver innovative results that are as unique as your business. We believe in continuously supporting our clients and building long lasting relationships. Whether you need a brand-new identity or need to revamp your existing brand, we can help.</p>
//       </div>
//       <div className='ulev__details-images section__padding'>
//         <div className="image-section">
//           <img src={detail1} alt="Image 1" />
//           <img src={detail2} alt="Image 2" />
//         </div>
//         <div className="single-image-section">
//           <img src={detail3} alt="Image 3" />
//         </div>
//         <div className="single-image-section">
//           <img src={detail4} alt="Image 4" />
//         </div>
//         <div className="single-image-section">
//           <img src={detail4} alt="Image 5" />
//         </div>
//         <div className="image-section">
//           <img src={detail5} alt="Image 6" />
//           <img src={detail6} alt="Image 7" />
//         </div>
//         <div className="image-section">
//           <img src={detail7} alt="Image 8" />
//           <img src={detail8} alt="Image 9" />
//         </div>
//       </div>
//       <div className="ulev_morePD section__padding" id="wgpt3">
//         <div className="ulev_morePD-contain">
//           <p className='ulev_morePD-other'></p>
//         </div>
//         <div className="ulev_morePD-text section__padding">
//           <p className="first-paragraph">
//             <h1 style={{fontSize: "20px", color: '#ffffff'}}>CASE REVIEW: Formed from Conception of Idea.</h1>
//               The brand identity for Mayen Spices & Foods was created solely from the business owner’s idea. The logo was hand sketched to provide a unique identity for the product line.  The vibrant color scheme was precisely selected to illuminate the beauty of the product and grab the attention of the onlooker on store shelves and online. The presentation included billboard mockups, social media mood boards, and merchandise.</p>
//           <p className="second-paragraph">Brand Identity <br/> website</p>
//         </div>
//       </div>
//       <div className="related-container section__padding">
//         <h1 className='related'>Related</h1>
//         <Link to="/project1Details" className="related-card">
//           <div className="related-image-container">
//             <img src={detail9} alt="Featured Image" className="related-image" />
//             <div className="overlay">
//               <h2>Cartonation 1995 LTD </h2>
//               <p>Naming, Website, UI/UX</p>
//               <p>Cameroon - Africa</p>
//             </div>
//           </div>
//         </Link>
//         <Link to="/project1Details" className="related-card">
//           <div className="related-image-container">
//             <img src={detail10} alt="Featured Image" className="related-image" />
//             <div className="overlay">
//               <h2>Mercedes Benz</h2>
//               <p>Website, Photography</p>
//               <p>France - Europe</p>
//             </div>
//           </div>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Project10Details;