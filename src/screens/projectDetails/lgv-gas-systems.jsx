import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import Image from '../../@/components/Image'
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const IMG_SRC = "https://i.postimg.cc/sz0ssXbF/mayen1.avif";

const Project17Details = () => {
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
          <h1>LGV Gas Systems<br/> Nigeria</h1>
          <h2>Your Trusted Partner For Safe, Seamless Gas Delivery </h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
        
      </div>

      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/v7fs5no5gmvkfwt0i83wn/Sequence-02_5.mp4?rlkey=6sah7sudypaxsvwv7sa5xkdy6&st=0wvinnsl&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'></h1>
              Many Nigerians face difficulties with traditional gas distribution including inconvenient refills, safety concerns, and inconsistent supply. Traditional gas delivery methods can be time-consuming, require heavy lifting, and raise safety anxieties.<br/><br/>
              <b style={{color: "#fff"}}> LGV Gas Systems saw an opportunity to revolutionize the gas delivery experience by offering: </b><br/> <b style={{color: "#fff"}}> Convenience at your fingertips: </b> Say goodbye to the days of lugging heavy gas cylinders. LGV Gas pipeline network brings gas directly to your home or business, eliminating the need for refills.<br/>
              <b style={{color: "#fff"}}> Safety first, always: </b> Safety is at the heart of everything we do. Our state-of-the-art pipelines and commitment to the highest safety standards ensure peace of mind for you and your family.<br/>
              <b style={{color: "#fff"}}> Reliable gas supply, every time: </b> No more wondering if you'll run out of gas in the middle of cooking a meal. LGV Gas system guarantees a consistent gas flow, emphasizing reliability. <br/><br/>

              Ulevus has developed a new visual identity and brand strategy for LGV Gas Systems that draws on the company's 25-year rich history of commitment to reliable gas delivery and heightened levels of safety and quality. 
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>

      <div className='ulev__details-images section__padding'>
          {/* <div className="image-section">
            <BlurhashImg src="https://i.postimg.cc/jKN9mSb4/mayen10.avif" placeholderColor="#888"/>
            <BlurhashImg src="https://i.postimg.cc/Kcy9xt2r/mayen12.avif" placeholderColor="#888"/>
          </div> */}
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/wHwdjvqw/LOGO.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/vbjF5N69/LGV-GAS-LOGO-jpg.png" placeholderColor="#888"/>
        </div>
    </div>

    <div className="ulev_morePD section__padding" id="wgpt3">
      <div className="ulev_morePD-contain section__padding">
        <p className='ulev_morePD-other'></p>
        <div>
          <p className='ulev_morePD-p' style={{textAlign: "left"}}>
            <h1 className='ulev_morePD-brand'>How Ulevus Rebranded LGV Gas Systems: </h1>
            As part of its brand positioning, and to better align its brand with its mission and vision, LGV Gas Systems underwent a transformative branding process. <br/>
            The major objectives for LGV Gas Systems were to enhance brand perception, create a consistent brand identity, and increase visibility as a trusted brand in its industry as it seeks to increase the distribution of gas through pipelines.<br/>
            The Ulevus team immersed themselves in research. After carrying out an extensive audit, we developed a brand strategy that communicates safety, trust, and convenience, making LGV Gas Systems stand out.<br/>

          </p>
          <br/>
          <p className='ulev_morePD-p'></p>
        </div>
        
      </div>
      {/* <div className="ulev_morePD-text">
      </div> */}
    </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/M6DJRZyK/LGV-GAS-BRAND-ICONS.png" placeholderColor="#888"/>
        </div>

        <div className="image-section-new">
          <div className="single-image-section-new fifty-percent-width">
            <BlurhashImg src="https://i.postimg.cc/LHtcK4QB/LGV-GAS-BRAND-MARK.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new fifty-percent-width">
            <BlurhashImg src="https://i.postimg.cc/nnD82GvW/LGV-GAS-LAPTOP-BRAND-MARK.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/hcGcLmZF/LGV-GAS-TYPE.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/gYhYwPSn/LGV-GAS-TYPEFACE-1.png" placeholderColor="#888"/>
        </div>
      </div>


      <div className='ulev__details-video sectionar__padding'>
        <div className="video-container flex flex-col items-center md:flex-row md:justify-between">
          <div className="video-wrapper mb-8 md:mb-0">
            <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/9vxsf5yjs52v1lf1m45xx/Sequence-01_3.mp4?rlkey=4kb8l8ggglj4z1019rv7y84bz&st=ujrtcitw&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="video-wrapper">
            <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/yzn84fu0yxh1xdyrnf9ok/Sequence-01-2.mp4?rlkey=m7jcikm32rx1fiy3571u4xv66&st=1fqcl5xb&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>


      <div className='ulev__details-images section__padding'>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/9cR2ShjJ/Color-1.png" placeholderColor="#888"/>
        </div>
        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/QXYyrBk7/LGV-GAS-BRAND-PATTERN.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/Yr4y2pbs/LGV-GAS-BRAND-PATTERN-2.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/mRygNBb9/gfffd-1.png" placeholderColor="#888"/>
        </div>
      </div>
      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Rebranding Strategy</h1>
              <b style={{color: "#fff"}}>The rebranding strategy included the following:</b> <br/>
              <b style={{color: "#fff"}}>Logo Design: </b>  <br/>
              We ditched the predictable “fire” symbol and opted for something distinct. A design that showcases LGV Gas Systems' commitment to ensuring efficient gas service for you.<br/>
              The new logo emphasized streamlined and well-controlled delivery, ensuring that clients experience reliable and prompt access to gas supply.<br/>
              <b style={{color: "#fff"}}>Brand Mark:</b> <br/>
              The meticulously designed logo is matched by a one-in-a-kind brandmark. <br/>
              It cleverly incorporates the letters L, G, and V, with the L and V intersecting inside the G, illustrating safety and efficiency—the core of LGV Gas Systems. <br/>
              This design aids easy recognition. It can be used independently of the logo and applied across various brand touchpoints, reinforcing consistency and brand recognition, and making LGV Gas Systems distinct from other major players. <br/>
             
              <b style={{color: "#fff"}}> Brand Patterns: </b><br/>
              These brand patterns add a dynamic visual element to the brand identity, reinforcing the essence of seamless gas transfer. Integrating this concept into their visual language communicates the reliability and efficiency of LGV Gas Systems, enhancing the brand narrative. <br/>
              The distinctive patterns set them apart in the market, creating a memorable visual identity. Infusing these inspirations into color codes establishes a visually appealing brand identity that communicates a deeper narrative about our gas distribution services' quality and efficiency. <br/>
              This thoughtful integration enhances the overall impact, strengthening the connection between the brand and its core values. <br/>
              <b style={{color: "#fff"}}> Typography (Montserrat): </b><br/>
              This modern typeface offers a clean, readable look and comes in a variety of weights, providing LGV Gas Systems with the flexibility to create a cohesive visual identity.<br/>
              Montserrat Bold signifies strength for headings, while Montserrat Regular ensures legibility and a contemporary feel for body text. <br/>
              <b style={{color: "#fff"}}> Color: </b><br/>
              For LGV Gas Systems, our color palette comes from the symbolic association of blue fire with good gas. The choice of various blue shades holds significant meaning, traditionally linked to efficient and clean burning. Incorporating these colors conveys stability, and professionalism, and subtly communicates the quality and purity of gas they provide. <br/>
              <b style={{color: "#fff"}}> Imagery: </b><br/> The imagery showcased the real-world impact of LGV Gas Systems, showcasing the seamless gas distribution process and the positive influence on our customers' lives. While also reinforcing trust and safety.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>


      <div className='ulev__details-images section__padding'>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/qJCCMYnL/LGV-GAS-LETTER-HEAD-jpg.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/q4Wc0JyY/LGV-GAS-LAPTOP-STATIONARY.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/2CVjDWnd/LGV-GAS-BUSINESS-CARD-2-jpg.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/h4tW0Fr8/LGV-GAS-BOOK-COVER.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/ssfDTqXN/LGV-GAS-BUSINESS-CARD.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/NBR7xyK4/122-1.png" placeholderColor="#888"/>
        </div>
      </div>

      <div className="ulev_morePD section__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Implementation And Rollout</h1>
              This new brand identity has been integrated across different touchpoints, both online and offline.<br/>
              This consistency enhances a comprehensive brand identity, a recognizable brand presence, and a differentiation from other players.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>

      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/tlov5zc8otvuyg4mjtrcy/Sequence-02-1.mp4?rlkey=mtotwf4c56o3gr65fkdisunwx&st=5gwgqn60&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className='ulev__details-images section__padding'>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/HTRYsLtq/16-1.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/fM0K0tMD/LGV-GAS-ROLL-UP-DESIGNS.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/1sWR2BV5/LGV-GAS-ROLL-UP.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/WTy836L5/LGV-GAS-SOCIAL-MEDIA-DESIGN-jpg.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/GL3GzHnB/LGV-GAS-TWITTER.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/1yP0796Z/LGV-GAS-FACEBOOK-jpg.png" placeholderColor="#888"/>
        </div>

        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/byqHMmkw/LGV-GAS-FEATHER-BANNER-jpg.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/kJ9dBRRp/LGV-GAS-FEATHER-BANNER.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/SSV7pcf7/LGV-GAS-SOCIAL-MEDIA-DESIGNS-jpg.png" placeholderColor="#888"/>
        </div>






        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/GrCpyH1r/Tote-2.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/6BYZHCtd/Tote-3-Bag.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/PHK7mRgx/LGV-GAS-INDUSTRIL-ENGINEER-jpg.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/dqGYsj3C/BANNER-OUTDOOR.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/XNJKNX2M/Tote-4-Bag.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/mTNjTcRD/Tote-Bag.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/DFn2zHqw/LGV-GAS-LAND-YARD-jpg.png" placeholderColor="#888"/>
        </div>

        <div className="image-section-new">
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/zqcBb7qP/LGV-GAS-JACKET.png" placeholderColor="#888"/>
          </div>
          <div className="single-image-section-new">
            <BlurhashImg src="https://i.postimg.cc/wgzsgwBX/LGV-GAS-LAPTOP-STICKER-2.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/tX3N2K1c/LGV-GAS-TEE.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/ZTtLPbq3/LGV-GAS-TEE-E.png" placeholderColor="#888"/>
        </div>
        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/tyqjbPj1/LGV-GAS-LAPTOP-STICKER.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/fwnGrSCR/LGV-GAS-WATER-BOTTLE.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/9mGFkjZv/LGVGAS-INDUSTRAIL-Helmet.png" placeholderColor="#888"/>
        </div>

        <div className="single-image-section-new">
          <BlurhashImg src="https://i.postimg.cc/NBBFswnb/LGV-GAS-TANKER.jpg" placeholderColor="#888"/>
        </div>
        
      </div>

      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/3ffykr610g3yc08fnek1u/Sequence-02_4.mp4?rlkey=9nib8fprbd8p8bc42wddm608q&st=xsjiu0n8&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      


      <div className='ulev__details-images sectionas__padding'>
        <div className="image-section-anne">
          <div className="image-wrapper-web-anne" style={{ marginRight: '10px' }}>
            <BlurhashImg src="https://i.postimg.cc/KGzhPSQP/WEB-1.png" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/DFwwgRmY/web-2.png" placeholderColor="#888"/>
          </div>
        </div>

        <div className="image-section-anne">
          <div className="image-wrapper-web-anne" style={{ marginRight: '10px' }}>
            <BlurhashImg src="https://i.postimg.cc/V1Jc5wJ1/web-3.png" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/jq5m7HxZ/WEB-4.png" placeholderColor="#888"/>
          </div>
        </div>

      </div>


      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/annies-boutique" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/jvjs7jzeyxlg10fou9aih/15-Ulevus-Annies-Boutique-Sign-Post.jpg?rlkey=tk58qawvgrw4lqffqaxh5fppm&st=f57ibpu0&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Annie's Boutique <br/> &amp; Costume Jewelry</h2>
              <p>Brand Identity - Website</p>
              <p>Chicago - USA</p>
            </div>
          </div>
        </Link>
        <Link to="/african-rooted" className="related-card">
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

export default Project17Details;