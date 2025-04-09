import React from 'react'
import './blog.css'


const Blog = () => (
  <div className="gpt__blog section__padding">
    <div className="gpt__blog-feature">
      <h4>We Build <br/>Brands <br/>that Cannot be <br/>Ignored</h4>
    </div>
    <div className="gpt__blog-container-text">
      <h4>We are a design and communication agency that combines creativity and technology into ideas and experiences to improve and elevate businesse We bring unique artistic perspective cultivated from a diverse pool of creativ professionals from all over the world Incorporating user-driven research, insight, and imagination into creating modern design that cannot be ignored.</h4>
    </div>
    <div className="gpt__whatgpt-heading">
      <h1 className="explore__text">About Ulevus</h1>
    </div>
  </div>
);

export default Blog;




// import React, { useState } from 'react';
// import './blog.css';

// const Blog = () => {
//   const [expandedIndex, setExpandedIndex] = useState(null);

//   const handleImageClick = (index) => {
//     setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
//   };

//   const images = [
//     'https://media.giphy.com/media/VRhsYYBw8AE36/giphy.gif',
//     'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif',
//     'https://media.giphy.com/media/VRhsYYBw8AE36/giphy.gif',
//     'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif',
//     'https://media.giphy.com/media/VRhsYYBw8AE36/giphy.gif',
//     'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif',
//   ];

//   const textDescriptions = [
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 1',
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 2',
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 3',
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 4',
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 5',
//     'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur, rerum omnis ab cumque totam vel maiores quibusdam cum dignissimos asperiores nulla quasi ullam similique, dolorum dicta! Molestiae, reiciendis. Delectus, dolor. 6',
//   ];

//   return (
//     <div className="blog-container section__padding">
//       {[1, 2, 3, 4, 5, 6].map((index) => (
//         <div
//           key={index}
//           className={`box ${expandedIndex === index ? 'enlarged' : ''}`}
//           onClick={() => handleImageClick(index)}
//         >
//           <img
//             src={images[index - 1]} 
//             alt={`Example gif ${index}`}
//             className="responsive"
//             id={`clickableImage${index}`}
//           />
//           <p>
//             {textDescriptions[index - 1]}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default Blog;
