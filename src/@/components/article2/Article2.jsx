// import React from 'react';
// import './article2.css';
// import Slider from 'react-slick';
// import { useMediaQuery } from 'react-responsive';
// import BlurhashImg from '../../../@/components/Image/BlurhashImg';

// const Article2 = ({
//   photos,
//   email,
//   hobbies,
//   favoriteBooks,
//   favoriteMovie,
//   aspiration,
//   showDetailsInfo,
//   sliderSettings,
//   bio,
//   moreBio,
//   name,
//   address
// }) => {
//   const displayPhoto = photos && photos.length > 0 ? photos[0] : null;

//   const isMobile = useMediaQuery({ maxWidth: 768 });
//   const isNotMobile = useMediaQuery({ minWidth: 769 });

//   return (
//     <div className='ulev__blog-container_article'>
//       <div className='ulev__blog-container_article-image'>
//         <img src={displayPhoto} alt="team_image" />
//       </div>
//       <div className='ulev__blog-container_article-content'>
//         <div className='detail'>
//           <h3 className='name'>{name}</h3>
//           <h5 className='address'>{address}</h5>
//         </div>
//         {sliderSettings && (
//           <Slider {...sliderSettings}>
//             {photos && photos.map((photo, index) => (
//               <BlurhashImg key={index} src={photo} alt={`Team Member ${index + 1}`} className="slider-image" placeholderColor="#888"/>
//             ))}
//           </Slider>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Article2;














// import React from'react';
// import './article2.css';
// import Slider from'react-slick';
// import { useMediaQuery } from'react-responsive';
// import BlurhashImg from '../../../@/components/Image/BlurhashImg';
// import { Link } from'react-router-dom';

// const Article2 = ({
//   photos,
//   email,
//   hobbies,
//   favoriteBooks,
//   favoriteMovie,
//   aspiration,
//   showDetailsInfo,
//   sliderSettings,
//   bio,
//   moreBio,
//   name,
//   address,
//   id,
//   slug
// }) => {
//   const displayPhoto = photos && photos.length > 0? photos[0] : null;

//   const isMobile = useMediaQuery({ maxWidth: 768 });
//   const isNotMobile = useMediaQuery({ minWidth: 769 });

//   return (
//     <div className='ulev__blog-container_article'>
//       <div className='ulev__blog-container_article-image'>
//         <img src={displayPhoto} alt="team_image" />
//       </div>
//       <div className='ulev__blog-container_article-content'>
//         <div className='detail'>
//           <h3 className='name'>{name}</h3>
//           <h5 className='address'>{address}</h5>
//         </div>
//         {sliderSettings && (
//           <Slider {...sliderSettings}>
//             {photos && photos.map((photo, index) => (
//               <BlurhashImg key={index} src={photo} alt={`Team Member ${index + 1}`} className="slider-image" placeholderColor="#888"/>
//             ))}
//           </Slider>
//         )}
//         <Link to={`/team/${slug}`}>
//           View Profile
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Article2;






import React from 'react';
import './article2.css';
import Slider from 'react-slick';
import { useMediaQuery } from 'react-responsive';
import BlurhashImg from '../../../@/components/Image/BlurhashImg';
import { Link } from 'react-router-dom';

const Article2 = ({
  photos,
  email,
  hobbies,
  favoriteBooks,
  favoriteMovie,
  aspiration,
  showDetailsInfo,
  sliderSettings,
  bio,
  moreBio,
  name,
  address,
  id,
  slug
}) => {
  const displayPhoto = photos && photos.length > 0 ? photos[0] : null;

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isNotMobile = useMediaQuery({ minWidth: 769 });

  return (
    <Link to={`/team/${slug}`} className='ulev__blog-container_article'>
      <div className='ulev__blog-container_article-image'>
        <img src={displayPhoto} alt="team_image" />
      </div>
      <div className='ulev__blog-container_article-content'>
        <div className='detail'>
          <h3 className='name'>{name}</h3>
          <h5 className='address'>{address}</h5>
        </div>
        {sliderSettings && (
          <Slider {...sliderSettings}>
            {photos && photos.map((photo, index) => (
              <BlurhashImg key={index} src={photo} alt={`Team Member ${index + 1}`} className="slider-image" placeholderColor="#888"/>
            ))}
          </Slider>
        )}
      </div>
    </Link>
  );
};

export default Article2;
