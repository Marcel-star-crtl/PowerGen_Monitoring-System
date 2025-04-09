// import React, { useEffect, useState, useRef } from 'react';
// import './header.css';

// const Header = () => {
//   const [isHeaderVisible, setHeaderVisible] = useState(false);
//   const headerRef = useRef(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             setHeaderVisible(true);
//           }
//         });
//       },
//       { threshold: 0.5 } 
//     );

//     if (headerRef.current) {
//       observer.observe(headerRef.current);
//     }

//     return () => {
//       if (headerRef.current) {
//         observer.unobserve(headerRef.current);
//       }
//     };
//   }, []);

//   return (
//     <div
//       className={`gpt3__header section__padding ${isHeaderVisible ? 'animate' : ''}`}
//       id="home"
//       ref={headerRef}
//     >
//       <div className="gpt3__header-content">
//         <h1>Hey, <br/> We are Ulevus!</h1>
//         <p>We Build Brands that <br /> Cannot be Ignored.</p>
//       </div>
//     </div>
//   );
// }

// export default Header;








import React, { useEffect, useState, useRef } from 'react';
import './header.css';

const Header = () => {
  const [isHeaderVisible, setHeaderVisible] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderVisible(true);
          }
        });
      },
      { threshold: 0.5 } 
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`gpt3__header section__padding ${isHeaderVisible ? 'animate' : ''}`}
      id="home"
      ref={headerRef}
    >
      <div className="ulev_hero-contain">
        <p className='ulev_hero-other'></p>
        <p className='ulev_hero-p' style={{textAlign: "left"}}>
          <h1 className='ulev_hero-brand'>We are Ulevus!</h1>
          <span className="hide-on-small-screens">
            A design and communication company that combines creativity and technology into ideas and experiences to improve and elevate businesses
          </span>
        </p>
      </div>
      <div className="gpt3__header-content">
        <h1>We Build Brands that Cannot be Ignored.</h1>
      </div>
    </div>
  );
}

export default Header;

