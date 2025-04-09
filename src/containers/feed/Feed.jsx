import React, { useRef, useEffect } from 'react';
import './feed.css';

const Feed = ({ post, onClose }) => {
  const modalRef = useRef(null);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!post) {
    return null; 
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <button className="close-button" onClick={onClose}>
          &#x2716;
        </button>
        <div className="flex-container">
          <div className="text-container">
            <h1>{post.title}</h1>
          </div>
          <img src={post.coverImage || post.image} alt="Post Featured Image" className="unwrapped-image" />
          <div className="text-container">
            <p
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{ color: 'white', paddingTop: '20px' }}
            />
          </div>
        </div>
        <button className="close-button-down" onClick={onClose}>
          Back To Ideas
        </button>
      </div>
    </div>
  );
};

export default Feed;









// import React, { useRef, useEffect } from 'react';
// import './feed.css';

// const Feed = ({ post, onClose }) => {
//   const modalRef = useRef(null);

//   const handleClickOutside = (event) => {
//     if (modalRef.current && !modalRef.current.contains(event.target)) {
//       onClose();
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const getImageUrl = () => {
//     if (post.modalImage) {
//       return post.modalImage;
//     } else if (post.postImage) {
//       return post.postImage;
//     } else {
//       return '';
//     }
//   };

//   const getExcerpt = () => {
//     if (post.excerpt) {
//       return post.excerpt;
//     } else if (post.content) {
//       return post.content.length > 180 ? post.content.slice(0, 180) + '...' : post.content;
//     } else {
//       return '';
//     }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content" ref={modalRef}>
//         <button className="close-button" onClick={onClose}>
//           &#x2716;
//         </button>
//         <div className="flex-container">
//           <div className="text-container">
//             <h1>{post.title}</h1>
//           </div>
//           <img src={getImageUrl()} alt="Post Featured Image" className="unrapped-image" />
//           <div className="text-container">
//             <p
//               dangerouslySetInnerHTML={{ __html: getExcerpt() }}
//               style={{ color: 'white', paddingTop: '50px' }}
//             />
//           </div>
//         </div>
//         <button className="close-button-down" onClick={onClose} style={{ marginLeft: "auto" }}>
//           Back To Ideas
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Feed;
