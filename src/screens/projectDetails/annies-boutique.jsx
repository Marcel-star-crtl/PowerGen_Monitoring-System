import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './projectDetails.css';
import { detail9, detail10 } from './imports';
import play from '../../main_assets/play.png';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';


const Project7Details = () => {
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
          <h1>Annie's Boutique <br/> &amp; Costume Jewelry</h1>
          <h2>Empowering women to look and feel their best with timeless pieces</h2></div>
        <p style={{ marginBottom: "auto" }}>Brand Identity <br/> website</p>
      </div>
      

      {/* <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/ax4h7mjkvv9xop2wuutsc/Annies-Boutique.mp4?rlkey=qw9nfonhmhzb07m47c2e22h2a&st=i4y3exga&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div> */}


      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video 
            ref={videoRef} 
            controls 
            autoPlay 
            loop 
            width="100%" 
            style={{ 
              objectFit: 'cover',
              maxHeight: '70vh', 
              height: 'auto' 
            }} 
            onEnded={handleVideoEnded} 
            onPause={handlePlayPause}
          >
            <source src="https://dl.dropboxusercontent.com/scl/fi/ax4h7mjkvv9xop2wuutsc/Annies-Boutique.mp4?rlkey=qw9nfonhmhzb07m47c2e22h2a&st=i4y3exga&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>


      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Logo Overview</h1>
              This design conveys Annie's Boutique and Costume Jewelry's commitment to craftsmanship and quality that transcends fleeting trends and fads. It speaks timelessness and sophistication.While also reflecting a symbol of tradition and heritage, a beacon of unwavering dedication to excellence.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>


      <div className='ulev__details-images sectiona__padding'>
        <div className="single-image-section ">
          <BlurhashImg src="https://i.postimg.cc/81pPd9Bb/1-Ulevus-Annies-Boutique-Logo-Sizes.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne"> */}
        <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/vyPDhYKx/2-Ulevus-Annies-Boutique-Logo-Sizes.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/FrKzv8YK/3-Ulevus-Annies-Boutique-Brand-Mark.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne">
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/vyPDhYKx/2-Ulevus-Annies-Boutique-Logo-Sizes.avif" placeholderColor="#888"/>
          </div>
          <div className="single-image-section">
            <BlurhashImg src="https://i.postimg.cc/FrKzv8YK/3-Ulevus-Annies-Boutique-Brand-Mark.avif" placeholderColor="#888"/>
          </div>
        </div> */}
        {/* </div> */}
        {/* <div className="single-image-section">
          <BlurhashImg src="" placeholderColor="#888"/>
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/1yZzXf82/4-Ulevus-Annies-Boutique-Logo-Icons.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/NYSFhNBg/5-Ulevus-Annies-Boutique-Immagery.avif" placeholderColor="#888"/>
        </div>
      </div>



      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Background</h1>
              Annie’s Boutique and Costume Jewelry, a Chicago-based company, embarked on a brand identity journey to reinforce its commitment to empowering women to look and feel their best with timeless pieces, while also committed to giving back to its community. 
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>

      <div className='ulev__details-images sectiona__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/nZCrP88R/6-Ulevus-Annies-Boutique-Color-System.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ZbY1WLc0/7-Ulevus-Annies-Boutique-Body-Text.png" placeholderColor="#888"/>
        </div>

        {/* <div className="image-section-anne">
          
          
        </div> */}


        <div className="image-section-anne">
          <BlurhashImg src="https://i.postimg.cc/X45JnwY9/8-Ulevus-Annies-Boutique-Header-Text.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/TRt2t0tv/9-Ulevus-Annies-Boutique-Pattern.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/JrdnzxX5/10-Ulevus-Annies-Boutique-Imagery.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne">
          
          
        </div> */}

      </div> 

      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Brand Identity Design Strategy</h1>
              <b style={{color: "#fff"}}>Logo Design:</b> The intricately designed logo conveys a commitment to quality and craftsmanship. It utilizes a symbol of tradition and an infinity loop, subtly representing the brand's dedication to creating classic pieces that transcend trends.  
              <br/><br/>
              <b style={{color: "#fff"}}>Brand mark:</b> The symbol is a pivotal element in Annie’s Boutique and Costume Jewelry’s visual identity, working hand-in-hand with the logo to represent the brand and easy recognition. The brand-mark is a simple, alluring, and memorable visual element that fully captures the brand’s essence and values.  It can be used independently of the logo and applied across various brand touch points, reinforcing consistency and brand recognition, giving Annie’s Boutique and Costume Jewelry a distinct presence among other major players. 
              <br/><br/>
              <b style={{color: "#fff"}}>Typeface : </b> Playfair Display typeface adds a touch of elegance and sophistication, aligning with the overall brand personality. It combines old-fashion charm with a cool, modern aesthetic, which are all key attributes of the brand. The typeface is used consistently across all brand touchpoints, creating a cohesive and easily-recognized visual identity. 
              <br/><br/>
              <b style={{color: "#fff"}}>Color System:</b> The color palette was carefully selected to evoke emotions and convey the brand's values. Purple signifies luxury and sophistication and reflects the high-quality nature of the merchandise. Gold adds opulence, emphasizing the brand's commitment to offering jewelry that transcends the ordinary. Grey offers neutrality, white symbolizes purity and timelessness while black adds a touch of mystery. Together, these colors create a cohesive and memorable brand identity. 
              <br/><br/>
              <b style={{color: "#fff"}}>Imagery:</b> The imagery used in the branding showcased distinct and elegant pieces, emphasizing the brand’s unique and timeless style. 
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div> 
        </div>
      </div>

      <div className='ulev__details-images sectiona__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FNRP15CQ/11-Ulevus-Annies-Boutique-Letter-Head.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/Yk8npq33/12-Ulevus-Annies-Boutique-Letter-Head.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne">
          
        </div> */}

        {/* <div className="single-image-section">
          <BlurhashImg src="" placeholderColor="#888"/>
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/YrzXLpwt/13-Ulevus-Annies-Boutique-Social-Media-Design.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/666MdD9n/14-Ulevus-Annies-Boutique-Social-Media-Designs-Story.avif" placeholderColor="#888"/>
        </div>
      </div>    

      {/* <div className='ulev__details-video sectionar__padding'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/0dw61x9gnrbnhfepgmyuz/Annies-Boutique-Socials.mp4?rlkey=470fvn4hlgf9jslwq2tvq2j11&st=o2rydc04&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div> */}


      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video 
            ref={videoRef} 
            controls 
            autoPlay 
            loop 
            width="100%" 
            style={{ 
              objectFit: 'cover',
              maxHeight: '70vh', 
              height: 'auto' 
            }} 
            onEnded={handleVideoEnded} 
            onPause={handlePlayPause}
          >
            <source src="https://dl.dropboxusercontent.com/scl/fi/0dw61x9gnrbnhfepgmyuz/Annies-Boutique-Socials.mp4?rlkey=470fvn4hlgf9jslwq2tvq2j11&st=o2rydc04&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div> 

      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Implementation And Rollout</h1>
              The new brand identity has been seamlessly integrated across all touchpoints, including social media profiles, delivery boxes, marketing materials, and  even on the website. This consistency ensures a recognizable brand presence and reinforces the brand's message. 
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>

      <div className='ulev__details-images sectionar__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/pRXS8nT4/15-Ulevus-Annies-Boutique-Sign-Post.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/cdPkV9mG/16-Ulevus-Annies-Boutique-Imagery.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne">
          
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/LRmQKZz5/18-Ulevus-Annies-Boutique-Roll-Up.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/8T7nXQLb/17-Ulevus-Annies-Boutique-Box.avif" placeholderColor="#888"/>
        </div>
        <div className="image-section-anne">
          <BlurhashImg src="https://i.postimg.cc/fwXqZc2t/19-Ulevus-Annies-Boutique-Magazine.avif" placeholderColor="#888"/>
        </div>

        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/ysQbTY3d/20-Ulevus-Annies-Boutique-Billboard.avif" placeholderColor="#888"/>
        </div>
      </div>
        {/* <div className="image-section-anne">
          <div className="video-wrapper">
            <video ref={videoRef} controls autoPlay width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/ogblo2d89roeqpmgzhlnl/Annies-Boutique-S.mp4?rlkey=fa5luhmsvte314ur9t2fwydl6&st=xszv6wh6&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <BlurhashImg src="https://i.postimg.cc/LRmQKZz5/18-Ulevus-Annies-Boutique-Roll-Up.avif" placeholderColor="#888"/>
        </div> */}

      
      {/* <div className='ulev__details-images sectiona__padding'>
        
      </div> */}


      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Objectives </h1>
              To showcase Annie’s Boutique and Costume Jewelry’s  dedication to helping clients feel confident and good, we strategically crafted a brand identity that portrays sophistication, elegance, and class, and ultimately position the brand as a trusted and reputable jewelry company.
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
          
        </div>
      </div>


      <div className='ulev__details-video sectionar__padding'>
        <div className="video-container flex flex-col items-center md:flex-row md:justify-between">
          <div className="video-wrapper mb-8 md:mb-0">
            <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/xovr4hc6p40nnym3h4l4p/Annies-Boutique-1.mp4?rlkey=x89wbeoqoznkdresl6bgb9b3u&st=nkmzqsv8&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="video-wrapper">
            <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/ogblo2d89roeqpmgzhlnl/Annies-Boutique-S.mp4?rlkey=fa5luhmsvte314ur9t2fwydl6&st=xszv6wh6&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>




      <div className='ulev__details-images sectiona__padding'>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/x0bh8DCd/21-Ulevus-Annies-Boutique-Rollup-Banner-1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/7HksL5dB/22-Ulevus-Annies-Boutique.avif" placeholderColor="#888"/>
        </div>
        {/* <div className="image-section-anne">
          
        </div> */}

        {/* <div className="single-image-section">
          <BlurhashImg src="" placeholderColor="#888"/>
        </div> */}
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/FFhBTYxf/23-Ulevus-Annies-Boutique.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-section">
          <BlurhashImg src="https://i.postimg.cc/V1FTdFYX/24-Ulevus-Annies-Boutique-Brand-Book-1.avif" placeholderColor="#888"/>
        </div>
      </div>
      {/* <div className='ulev__details-video'>
        <div className="video-container">
          <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
            <source src="https://dl.dropboxusercontent.com/scl/fi/2xce7wzkl137mjvp41i09/Sequence-02.mp4?rlkey=rnyynkode54uape7bp7qkbzk8&st=77pon33a&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>  */}
      <div className='ulev__details-video sectiona__padding'>
        <div className="video-container">
          <video 
            ref={videoRef} 
            controls 
            autoPlay 
            loop 
            width="100%" 
            style={{ 
              objectFit: 'cover',
              maxHeight: '70vh', 
              height: 'auto' 
            }} 
            onEnded={handleVideoEnded} 
            onPause={handlePlayPause}
          >
            <source src="https://dl.dropboxusercontent.com/scl/fi/2xce7wzkl137mjvp41i09/Sequence-02.mp4?rlkey=rnyynkode54uape7bp7qkbzk8&st=77pon33a&dl=0" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div> 
      <div className="ulev_morePD sectiona__padding" id="wgpt3">
        <div className="ulev_morePD-contain section__padding">
          <p className='ulev_morePD-other'></p>
          <div>
            <p className='ulev_morePD-p' style={{textAlign: "left"}}>
              <h1 className='ulev_morePD-brand'>Results And Impact</h1>
              The brand messaging now focuses on empowering women of all ages to feel confident and beautiful through timeless and elegant designs. With a clear brand identity and a focus on customer connection, Annie's Boutique & Costume Jewelry is well positioned to achieve continued growth and success.
              <br/><br/>
              <h1 className='ulev_morePD-brand'>Conclusion</h1>
              Annie's Boutique & Costume Jewelry's brand identity refresh demonstrates the power of a clear and well-defined brand. By aligning their visuals, messaging, and overall presentation with their core values, they have created a stronger connection with their target audience. This, coupled with the new website, empowers them to showcase their commitment to timeless design and exceptional customer service. With a recognizable brand presence and a focus on female empowerment, Annie's Boutique & Costume Jewelry is well-positioned for continued success. 
            </p>
            <br/>
            <p className='ulev_morePD-p'></p>
          </div>
        </div>
      </div>

      {/* <div className='ulev__details-images sectionas__padding'> */}
        
        {/* <div className="image-section-anne">
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/7H3R13S8/Home-1.avif" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/JrVgB6D5/Pre-Owned-1.avif" placeholderColor="#888"/>
          </div>
        </div>
        
        <div className="image-section-anne">
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/k7HL7X7Z/Home-2-1.avif" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/KmjdXghB/Add-to-Cart-1.avif" placeholderColor="#888"/>
          </div>
        </div> */}


      <div className='ulev__details-images sectionas__padding'>
        <div className="image-section-anne">
          <div className="image-wrapper-web-anne" style={{ marginRight: '10px' }}>
            <BlurhashImg src="https://i.postimg.cc/7H3R13S8/Home-1.avif" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/JrVgB6D5/Pre-Owned-1.avif" placeholderColor="#888"/>
          </div>
        </div>

        <div className="image-section-anne">
          <div className="image-wrapper-web-anne" style={{ marginRight: '10px' }}>
            <BlurhashImg src="https://i.postimg.cc/k7HL7X7Z/Home-2-1.avif" placeholderColor="#888"/>
          </div>
          <div className="image-wrapper-web-anne">
            <BlurhashImg src="https://i.postimg.cc/KmjdXghB/Add-to-Cart-1.avif" placeholderColor="#888"/>
          </div>
        </div>

      </div>

      {/* </div> */}


      <div className="related-container section__padding">
        <h1 className='related'>Other Projects</h1>
        <Link to="/work/ideal-farmers-yought-recognition-awards" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/8zlfjvv19hfoc4uc92owk/project1-1.avif?rlkey=7mjbj0mbxr3rojt3wa45d2qrb&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Ideal Farmers Recognition</h2>
              <p>Brand Identity, Website</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
        <Link to="/work/echolink-solutions" className="related-card">
          <div className="related-image-container">
            <LazyLoad offset={100}>
              <img src="https://dl.dropboxusercontent.com/scl/fi/28mkwmmxjc81x8ily9u9n/project0-1.avif?rlkey=stwcbb2rez4lzu698o0hbw53d&dl=0" alt="Featured Image" className="related-image" />
            </LazyLoad>
            <div className="overlay">
              <h2>Echolink Solutions</h2>
              <p>Brand Identity</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Project7Details;