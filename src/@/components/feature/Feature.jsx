import React from 'react';
import './feature.css';
import Brand from './../../../main_assets/brandbook.jpg';
import ui_ux from './../../../main_assets/project7.avif'
import web from './../../../main_assets/project3.avif'
import communication from './../../../main_assets/project5.avif'
import { team1, team2, team3, team4, team5, team6, team7, team8, team9 } from './imports'

const Blog = () => {
  return (
    <div className="cards-container">
      <div className="ulev__blog-content">
        <h1>What we Do</h1>
      </div>
      <div className="cards">
        <div className="card-header">
          <div className="card-title">01</div>
          <div className="card-description">BRAND IDENTITY</div>
          <img src="https://i.postimg.cc/Bq8Z0srF/Brand-Identity-1.avif" alt="Brand Identity" className="card-image" />
        </div>
        <div className="card-header">
          <div className="card-title">02</div>
          <div className="card-description">UI/UX DESIGN</div>
          <img src="https://i.postimg.cc/w9FvcwpW/UI-UX-1.avif" alt="UI/UX Design" className="card-image" />
        </div>
        <div className="card-header">
          <div className="card-title">03</div>
          <div className="card-description">WEB DEVELOPMENT</div>
          <img src="https://i.postimg.cc/c0t18d9L/Web-Development-1.avif" alt="Communication Strategy" className="card-image" />
        </div>
        <div className="card-header">
          <div className="card-title">04</div>
          <div className="card-description">COMMUNICATION STRATEGY</div>
          <img src="https://i.postimg.cc/nnn5fkDf/Communication-Strategy-1.avif" alt="Web Development" className="card-image" />
        </div>
      </div>
      <whatGPT3 />
    </div> 
  );
};

export default Blog;










// import React from 'react';
// import './feature.css';

// const Blog = () => {
//   return (
//     <div className="starting-point-container">
//       <div className="ulev__blog-content">
//         <h1>What we Do</h1>
//       </div>
//       <div className="cards">
//         <div className="card-header">
//           <div className="card-title">1</div>
//           <div className="card-description">BRAND NAMING</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">2</div>
//           <div className="card-description">BRAND IDENTIFY</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">3</div>
//           <div className="card-description">UI/UX DESIGN</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">4</div>
//           <div className="card-description">WEB DEVELOPMENT</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">5</div>
//           <div className="card-description">BRAND NAMING</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">6</div>
//           <div className="card-description">BUSINESS CON.</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">7</div>
//           <div className="card-description">MARKETING</div>
//         </div>
//         <div className="card-header">
//           <div className="card-title">8</div>
//           <div className="card-description">MARKETING</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Blog;
