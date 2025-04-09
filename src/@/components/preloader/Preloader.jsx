// import React from "react";
// import "./preloader.css";
// import ulevusLogo from "../../../main_assets/logo1.png"; 

// const Preloader = () => {
//   return (
//     <div className="preloader">
//       <img src={ulevusLogo} alt="Ulevus Logo" className="ulevus-logo" />
//       <div className="spinner"></div>
//     </div>
//   );
// };

// export default Preloader;


import React, { useState, useEffect } from "react";
import "./preloader.css";
import ulevusLogo from "../../../main_assets/logo.png";

const Preloader = () => {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLogo(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`preloader ${showLogo ? "show" : ""}`}>
      {showLogo && (
        <img src={ulevusLogo} alt="Ulevus Logo" className="ulevus-logo" />
      )}
    </div>
  );
};

export default Preloader;
