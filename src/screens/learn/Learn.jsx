// import React from 'react';
// import './learn.css';
// import { Post } from '../../@/components';

// const Learn = ({ articles }) => {
//   return (
//     <div className="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <Post articles={articles} />
//       <div className="ulev__learn section__padding" id="">
//       </div>
//     </div>
//   );
// };

// export default Learn;







import React from 'react';
import './learn.css';
import { Post } from '../../@/components';
import { useParams, useNavigate } from 'react-router-dom';

const Learn = ({ articles }) => {
  const { articleSlug } = useParams();
  const navigate = useNavigate();

  const handleReadMore = (article) => {
    navigate(`/ideas/${article.slug}`);
  };

  const handleCloseModal = () => {
    navigate('/ideas');
  };

  return (
    <div className="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Post 
        articles={articles} 
        onReadMore={handleReadMore} 
        selectedArticle={articles.find(a => a.slug === articleSlug)}
        onCloseModal={handleCloseModal}
      />
      <div className="ulev__learn section__padding" id=""></div>
    </div>
  );
};

export default Learn;