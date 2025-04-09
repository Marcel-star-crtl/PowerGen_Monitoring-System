import React, {useState, useRef} from 'react';
import './about.css';
import { Blog, Brand, Info, CTA } from '../../@/components';
import play from '../../main_assets/play.png';
import { Team } from '../../containers';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const About = () => {
  const [playing, setPlaying] = useState([false, false, false]);
  const videoRefs = [useRef(null), useRef(null), useRef(null)]; 

  const handlePlayPause = (index) => {
    return () => {
      if (videoRefs[index].current) {
        const updatedPlaying = [...playing];
        updatedPlaying[index] = !playing[index];
        setPlaying(updatedPlaying);

        const video = videoRefs[index].current;

        if (!playing[index] || video.ended) {
          video.play();
        } else {
          video.pause();
        }
      }
    };
  };

  const handleVideoEnded = (index) => () => {
    const updatedPlaying = [...playing];
    updatedPlaying[index] = false;
    setPlaying(updatedPlaying);
  };
  return (
    <div className="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div>
        {/* <Blog /> */}
        <div className="gpt__blog section__padding">
          <div className="gpt__blog-feature">
            <h4>We Build <br/>Brands <br/>that Cannot be <br/>Ignored</h4>
          </div>
          <div className="gpt__blog-container">
            <h4>We are a design and communications company that combines creativity and technology into ideas and experiences to improve and elevate businesses in Africa and across the globe. We bring unique artistic perspectives cultivated from a diverse pool of creative professionals from Africa and around the world. Incorporating user-driven research, insight, and imagination into creating modern designs that cannot be ignored.</h4>
          </div>
          <div className="gpt__whatgpt-heading">
            <h1 className="explore__text">About Ulevus</h1>
          </div>
        </div>
        {/* <Brand /> */}
        <div className="gpt__brand section__padding">
          <div className="gpt__brand-feature">
              <h4>Whether you <br/> need a brand- <br/> new identity or <br/> need to revamp <br/> your existing <br/> brand, we can <br/> help</h4>
          </div>
          <div className="gpt__brand-container" style={{ marginLeft: 'auto' }}>
              <h4>Where your vision for your business meets our innovative design solutions. We use the latest technology to deliver innovative results that is as unique as your business. With listening being our strongest attribute, we are always ready to guide your brand into the spotlight. Whether it's creating a fresh identity or revamping your existing brand, we’ve got you covered—the only thing we can’t do is basic.</h4>
          </div>
          <div className="gpt__whatgpt-heading">
              <h1 className="explore__text">Our Process</h1>
          </div>
        </div>
        <div className="single-image-sec section__padding">
          <BlurhashImg src="https://i.postimg.cc/dvmrvdpR/Website-Image-1.avif" placeholderColor="#888"/>
        </div>
        <div className="single-image-sec section__padding">
          <BlurhashImg src="https://i.postimg.cc/kCY0n1R9/mv7g1-xl8qr-1.avif" placeholderColor="#888"/>
        </div>

        <div className="ulev__inf section__padding">
          <div className="ulev__info-feat">
              <h4>Shape the future of African enterprises through magnificent designs and compelling visual identities that make their exceptional products and services stand out.</h4>
          </div>
          <div className="ulev__info-contain">
          </div>
          <div className="ulev__whatgpt-heading">
          </div>
        </div>
        <Team />

      </div>
    </div>
  )
}
 
export default About