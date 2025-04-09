import React, {useState, useEffect} from 'react'
import './footer.css'
import logo from '../../main_assets/logo.png';
import linked from '../../main_assets/link.PNG';
import link1 from '../../main_assets/link1.png';
import { FaInstagram, FaTwitter, FaFacebook, FaYoutube, FaShare } from 'react-icons/fa';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton, FacebookIcon, TwitterIcon, WhatsappIcon, LinkedinIcon, LinkedinShareButton, EmailShareButton, EmailIcon, RedditShareButton, RedditIcon } from 'react-share';
import { Link } from 'react-router-dom';
import { NewsLetter } from '../../containers';
import { PopupModal } from 'react-calendly';


const Footer = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  
  const shareUrl = 'https://your-website-url.com';
  const title = 'Check out our awesome website!';

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleShareButtonClick = () => {
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    document.body.classList.remove('popup-open');
  };

  const handleModalOpen = () => {
    openModal();
    document.body.classList.add('popup-open');
  };

  useEffect(() => {
    const handleBodyScroll = () => {
      if (isModalOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    };

    handleBodyScroll(); 
    window.addEventListener('scroll', handleBodyScroll);
    return () => {
      window.removeEventListener('scroll', handleBodyScroll); // Clean up scroll event listener
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="ulev__footer-icotext section__padding">
        {/* <button onClick={openModal} style={{ marginRight: 'auto', cursor: 'pointer', background: 'none', border: 'none' }}> */}
        <p style={{ marginRight: 'auto', background: 'none', border: 'none' }}>We are always looking to connect with great people.</p>
        <button style={{ display: 'flex', alignItems: 'center', marginRight: 'auto', background: 'none', border: 'none' }}>
          <p className='reach' style={{ marginRight: '10px', color: "#888" }}>Tell us about your project</p>
          {/* <span><img src={linked} alt="liked"/></span> */}
        </button>

        <button className='cont' onClick={openModal} style={{ display: 'flex', alignItems: 'center', marginRight: 'auto', marginTop: '25px', cursor: 'pointer', background: 'none', border: 'none' }}>
          <p style={{ marginRight: '20px', fontSize: "25px" }}>Contact</p>
          <span style={{ display: 'flex', justifyContent: 'center', paddingBottom: '5px' }}>
            <img src={link1} alt="liked" style={{}} />
          </span>
        </button>
        {/* <p style={{ marginRight: 'auto' }}>We Build Brands that Cannot be Ignored.<br/> Tell us about your project.</p>  */}
        {/* <Link to="/contact" className="bi-arrow-right" style={{ marginLeft: 'auto' }}>
          <img src={linked} alt="liked"/> */}
          {/* <svg xmlns="https://www.figma.com/file/pp6DNBm1y6ZdEKZlVymAHs/ULEVUS-WEBSITE?type=design&node-id=1345-558&mode=dev" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16" style={{ marginLeft: 'auto' }}>
            <path d="M1 8a.5.5 0 0 1 .5-.5h10.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L12.293 8.5H1.5A.5.5 0 0 1 1 8z" />
          </svg> */}
        {/* </Link> */}
      </div>
      <div className="ulev__footer">
        <div className="ulev__footer-btn">
          <div className='img'>
            <img src={logo} alt="logo" className="ulev__footer-btn-image" />
          </div>
          <div className='text'>
            <p>ULEVUS</p>
          </div>
        </div>

        {/* < NewsLetter /> */}
        <div className="ulev__footer-links">

          <div className="ulev__footer-links_logo">
            <p className='location'>Cameroon:</p>
            <p>Papa Douala Logpom</p>
            <p>Bassong, Douala,</p>
            {/* <p className='calls'>Call Us:</p> */}
            <p>+237-67-962-3977</p>
            <p>info@ulevus.com</p>
          </div>
          
          <div className="ulev__footer-links_div">
            <h4 className='insta'>
              <a href="https://www.instagram.com/thisisulevus/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </h4>
          </div>
          <div className="ulev__footer-links_div">
            <h4>
              <a href="https://twitter.com/thisisulevus/" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            </h4>
          </div>
          <div className="ulev__footer-links_div">
            <h4>
              <a href="https://web.facebook.com/thisisulevus/" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </h4>
          </div>
          <div className="ulev__footer-links_div">
            <h4>
              <a href="https://www.youtube.com/channel/UC2VYFPneJ7JStF3l8qHwj6Q" target="_blank" rel="noopener noreferrer">
                Youtube
              </a>
            </h4>
          </div>
          <div className="ulev__footer-copyright">
            <p className='location'>USA:</p>
            <p>3432 W. Diversey Ave. Floor 2</p>
            <p>Chicago, IL 60647</p>
            {/* <p className='calls'>Call Us:</p> */}
            <p>+1 312-761-5993</p>
            <p>info@ulevus.com</p>
            {/* <div>
              {isModalOpen && (
                <div className="social-media-modal" onClick={closeModal}>
                  <div className="social-media-modal-content" onClick={(e) => e.stopPropagation()}>
                    <FacebookShareButton url={shareUrl} quote={title}>
                      <FacebookIcon round size={27} />
                    </FacebookShareButton>
                    <TwitterShareButton url={shareUrl} title={title}>
                      <TwitterIcon round size={27} />
                    </TwitterShareButton>
                    <WhatsappShareButton url={shareUrl} title={title}>
                      <WhatsappIcon round size={27} />
                    </WhatsappShareButton>
                    <LinkedinShareButton url={shareUrl} title={title}>
                      <LinkedinIcon round size={27} />
                    </LinkedinShareButton>
                    <EmailShareButton url={shareUrl} subject={title}>
                      <EmailIcon round size={27} />
                    </EmailShareButton>
                    <RedditShareButton url={shareUrl} title={title}>
                      <RedditIcon round size={27} />
                    </RedditShareButton>
                    <button onClick={closeModal}>Close</button>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        </div>
        {/* <div className="ulev__TOF section__padding">
          <div className="left-section">
            <p>&copy; 2023 ulevus. All rights reserved.</p>
          </div>
          <div className="center-section">
            <p>Terms of Service</p>
          </div>
          <div className="right-section">
            <p>Share on social media</p>
            <FaShare color="#fff" size={27} onClick={handleShareButtonClick} style={{ marginLeft: '20px' }}/>
          </div>
        </div> */}
      </div>
      <PopupModal
        url="https://calendly.com/ulevus/tell-us-about-your-project"
        onModalClose={handleModalClose}
        open={isModalOpen}
        rootElement={document.getElementById('root')}
        styles={{
          modal: {
            overflow: 'hidden'
          }
        }}
      />
    </>
  );
}

export default Footer

