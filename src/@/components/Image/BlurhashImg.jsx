// import React, { useEffect, useState } from 'react';
// import { Blurhash } from 'react-blurhash';
// import { motion } from 'framer-motion';
// import { encodeImageToBlurhash } from './encoder';
// import "./image.css"

// const BlurhashImg = ({ src, blurhashSize }) => {
//   const [hashUrl, setHashUrl] = useState('');
//   const [imgIsLoading, setImgIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       const hash = await encodeImageToBlurhash(reduceImgUrlDimensions(src, blurhashSize));
//       setHashUrl(hash);
//     };
//     fetchData();
//   }, [src, blurhashSize]);

//   const onLoaded = () => setImgIsLoading(false);

//   return (
//     <>
//       {hashUrl && <Blurhash hash={hashUrl} width="100%" height="100%" />}
//       <motion.img
//         initial={{ opacity: 0 }}
//         animate={{ opacity: imgIsLoading ? 0 : 1 }}
//         transition={{ opacity: { delay: 0.5, duration: 0.4 } }}
//         onLoad={onLoaded}
//         className="image"
//         src={src}
//         loading="lazy"
//         width="100%"
//         height="100%"
//       />
//     </>
//   );
// };

// const reduceImgUrlDimensions = (input, size = '19x19') => {
//   const regex = /\d+x\d+/;
//   const match = input.match(regex);

//   if (match) {
//     const replacement = size;
//     return input.replace(regex, replacement);
//   } else {
//     console.info('Dimensions pattern not found so returning input as is');
//     return input;
//   }
// };

// export default BlurhashImg;



// import React, { useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import "./image.css"

// const BlurhashImg = ({ src, placeholderColor }) => {
//   const [imgIsLoading, setImgIsLoading] = useState(true);

//   const onLoaded = () => setImgIsLoading(false);

//   return (
//     <>
//       {imgIsLoading && <div style={{ backgroundColor: placeholderColor, width: '100%', height: '100%' }} />}
//       <motion.img
//         initial={{ opacity: 0 }}
//         animate={{ opacity: imgIsLoading ? 0 : 1 }}
//         transition={{ opacity: { delay: 0.5, duration: 0.4 } }}
//         onLoad={onLoaded}
//         className="image"
//         src={src}
//         loading="lazy"
//         width="100%"
//         height="100%"
//       />
//     </>
//   );
// };

// export default BlurhashImg;





import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LazyLoad from 'react-lazyload';

const BlurhashImg = ({ src, placeholderColor }) => {
  const [imgIsLoaded, setImgIsLoaded] = useState(false);

  const handleImageLoad = () => {
    setImgIsLoaded(true);
  };

  return (
    <LazyLoad once>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!imgIsLoaded && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: placeholderColor }} />
        )}
        <motion.img
          src={src}
          alt=""
          onLoad={handleImageLoad}
          // style={{ opacity: imgIsLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out', width: '100%', height: '100%', objectFit: 'cover' }}
          className='lazy-image'
        />
      </div>
    </LazyLoad>
  );
};

export default BlurhashImg;
