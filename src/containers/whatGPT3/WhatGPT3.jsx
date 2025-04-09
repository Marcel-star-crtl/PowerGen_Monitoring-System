import React from 'react'
import './whatGPT3.css'
import { Link } from 'react-router-dom';

const WhatGPT3 = () => (
  <div className="gpt3__whatgpt3" id="wgpt3">
    {/* <div className="gpt3__whatgpt3-feature">
      <h4>Whether it is body products, food,<br /> fashion, entertainment, or the technology <br/>industry, our passion is to make your brand<br/> and products standout</h4>
    </div>
    <div className="gpt3__whatgpt3-container" style={{ marginLeft: 'auto' }}>
      <h4>We are always<br/> Looking for Great<br/>People</h4>
    </div> */}
    <div className="gpt3__whatgpt3-heading">
      <h1 className="explore">Welcome to Our World</h1>
      {/* <p>view our recent project</p> */}
      <Link to="/annies-boutique">
        <p>View our recent project</p>
      </Link>
    </div>
  </div>
);

export default WhatGPT3;
