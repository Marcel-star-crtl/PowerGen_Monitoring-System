import React from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Home from "../../screens/work/Work"
import Work from "../../screens/work/Work"
import Learn from "../../screens/learn/Learn"
import Contact from "../../screens/contact/Contact"
import About from "../../screens/about/About"
import { TeamDetails } from '../../screens'

import { AnimatePresence } from 'framer-motion/dist/framer-motion'

const AnimatedRoutes = () => {
    const location = useLocation();
  return (
      <>
        <AnimatePresence>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/work" element={<Work />} />
                <Route path="/teamDetails/:memberId" element={<TeamDetails />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </AnimatePresence>
        
      </>
    
  )
}

export default AnimatedRoutes