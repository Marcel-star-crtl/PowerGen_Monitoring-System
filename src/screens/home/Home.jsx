// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { collection, query, where, onSnapshot } from 'firebase/firestore';
// import { db } from '../../firebase';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';
// import './home.css';

// const Home = () => {
//   const [featuredProjects, setFeaturedProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchFeaturedProjects = () => {
//       const q = query(collection(db, 'projects'), where('isFeatured', '==', true));
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         const fetchedProjects = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
        
//         console.log('Fetched featured projects:', fetchedProjects); // Check fetched projects
//         setFeaturedProjects(fetchedProjects);
//         setLoading(false); // Set loading to false after fetching
//       }, (error) => {
//         console.error('Error fetching featured projects:', error);
//         setError(error.message);
//         setLoading(false); // Set loading to false in case of error
//       });

//       return () => unsubscribe(); // Clean up subscription on unmount
//     };

//     fetchFeaturedProjects();
//   }, []);

//   if (loading) return <div>Loading featured projects...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div className="home">
//       <h1>Featured Projects</h1>
//       <div className="featured-projects">
//         {featuredProjects.length > 0 ? (
//           featuredProjects.map((project) => (
//             <Link key={project.id} to={`/work/${project.id}`} className="home_project-cards">
//               <div className="home_project-image">
//                 <BlurhashImg src={project.coverMedia?.url} placeholderColor="#888" />
//                 <div className="home_overlay">
//                   <h2>{project.title || 'No Title'}</h2>
//                   <p>{project.subtitle || 'No Subtitle'}</p>
//                   <p>{project.location || 'No Location'}</p>
//                 </div>
//               </div>
//             </Link>
//           ))
//         ) : (
//           <div>No featured projects available</div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;











import React, { useState, useRef, useEffect } from 'react';
import './home.css';
import { Header, WhatGPT3 } from '../../containers'
import { Feature, Post } from '../../@/components'
import play from '../../main_assets/play.png'
import feature from '../../main_assets/project3.avif'
import brandbook from '../../main_assets/brandbook.jpg'
import { Link } from 'react-router-dom';
import Modale from '../../containers/feed/Feed';
import axios from 'axios';
import Masonry from 'react-layout-masonry';
import LazyLoad from 'react-lazyload';
import { Blurhash } from 'react-blurhash';
// import Modal from '../../../@/components/modal/Modal';
import Modal from '../../@/components/modal/Modal';
import { excerpt } from '../../@/components/post/excerpt'
import BlurhashImg from '../../@/components/Image/BlurhashImg';
import Chinelo from "../../main_assets/Chineloo.avif"
import { getDocs, collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';


const Home = () => {
  const [playing, setPlaying] = useState([false, false, false]);
  const videoRefs = [useRef(null), useRef(null), useRef(null)];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [modalPost, setModalPost] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const videoRef = useRef(null);

  const handlePlaysPauses = () => {
    if (videoRef.current) {
      setPlaying(!playing);
      const video = videoRef.current;

      if (!playing || video.ended) {
        video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    }
  }; 

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


  const handlePlayPauseSec = (index) => {
    return () => {
      const updatedPlaying = [...playing];
      updatedPlaying[index] = !playing[index];
      setPlaying(updatedPlaying);
  
      const video = videoRefs[index].current;
  
      if (!playing[index] || video.ended) {
        video.play();
      } else {
        video.pause();
      }
    };
  };
  
  
  
  

  const handleVideoEnded = (index) => () => {
    const updatedPlaying = [...playing];
    updatedPlaying[index] = false;
    setPlaying(updatedPlaying);
  };

  const openModal = (image) => {
    setModalImage(image);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  // const handleReadMore = (index) => {
  //   const clickedPost = posts[index];
  //   const postWithImage = { ...clickedPost, image: clickedPost.image };
  //   setModalPost(postWithImage);
  // };

  const handleReadMore = (post) => {
    setModalPost(post);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };


  const filterPosts = () => {
    if (selectedCategory === 'all') {
      return posts;
    }
    return posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('muted', true);
    }
  }, []);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const postsCollection = collection(db, 'news');
        const recentPostsQuery = query(
          postsCollection,
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snapshot = await getDocs(recentPostsQuery);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt.toDate().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching recent posts:", error);
      }
    };
  
    fetchRecentPosts();
  }, []);


  useEffect(() => {
    const fetchFeaturedProjects = () => {
      const q = query(collection(db, 'projects'), where('isFeatured', '==', true));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          featureImage: doc.data().featureImage,
        }));
        
        console.log('Fetched featured projects:', fetchedProjects); // Check fetched projects
        setFeaturedProjects(fetchedProjects);
        setLoading(false); // Set loading to false after fetching
      }, (error) => {
        console.error('Error fetching featured projects:', error);
        setError(error.message);
        setLoading(false); // Set loading to false in case of error
      });

      return () => unsubscribe(); // Clean up subscription on unmount
    };

    fetchFeaturedProjects();
  }, []);

  // if (loading) return <div>Loading featured projects...</div>;
  // if (error) return <div>Error: {error}</div>;

  const fetchFeaturedProjects = async () => {
    try {
      const projectsCollection = collection(db, 'projects');
      const featuredProjectsQuery = query(
        projectsCollection,
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
      const snapshot = await getDocs(featuredProjectsQuery);
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeaturedProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching featured projects:", error);
    }
  };


  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className='carousel'>
        <Header />
        <div className="featured-projects">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => (
              <Link key={project.id} to={`/work/${project.slug}`} className="home_project-cards">
                <div className="home_project-image">
                  <BlurhashImg 
                    src={project.featureImage || project.coverImage} 
                    placeholderColor="#888" 
                  />
                  <div className="home_overlay">
                    <h2>{project.title || 'No Title'}</h2>
                    <p>{project.subtitle || 'No Subtitle'}</p>
                    <p>{project.location || 'No Location'}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div>No featured projects available</div>
          )}
        </div>  
        {/* <Link to="/work/echolink-solutions" className="home_project-cards" id='newwest'>
          <div className="home_project-image" >
            <BlurhashImg src="https://i.postimg.cc/51bb1WWr/Silicon-1.avif" placeholderColor="#888"/>
            <div className="home_overlay">
              <h2>Echolink Solutions</h2>
              <p>Brand Identity, Website</p>
              <p>USA</p>
            </div>
          </div>
        </Link>
        <Link to="/work/apprey-public-relations-pr" className="home_project-cards" id='newwest'>
          <div className="home_project-image" >
            <BlurhashImg src="https://i.postimg.cc/vbRQjxHW/Apprey-1.avif" placeholderColor="#888"/>
            <div className="home_overlay">
              <h2>Apprey Public Relations</h2>
              <p>Brand Identity, Design Implementation</p>
              <p>Chicago - USA</p>
            </div>
          </div>
        </Link>
        <Link to="/work/editi" className="home_project-cards" id='newwest'>
          <div className="home_project-image" >
            <BlurhashImg src="https://i.postimg.cc/q48CZT0v/Editi-1.avif" placeholderColor="#888"/>
            <div className="home_overlay">
              <h2>Electronic Data interchange Technology Institute (EDITI)</h2>
              <p>Brand Identity</p>
              <p>Washington - USA</p>
            </div>
          </div>
        </Link>
        <Link to="/work/Lewa" className="home_project-cards" id='newwest'>
          <div className="home_project-image" >
            <BlurhashImg src="https://i.postimg.cc/hSGsBjPr/Lewa-1.avif" placeholderColor="#888"/>
            <div className="home_overlay">
              <h2>Lewa</h2>
              <p>Brand Identity, Design Implementation, Naming</p>
              <p>Cameroon - Africa</p>
            </div>
          </div>
        </Link> */}
        <Feature />
        {/* <Post /> */}
        <div className="post-grid">
          <div className="category-buttons">
            <button className='btn'> Articles</button>
            <button className='btn2' style={{marginLeft: 'auto'}}>
              <Link to="/learn" style={{ textDecoration: 'underline', color: 'white' }}>
                see more
              </Link>
            </button>
          </div>
          <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={16} columnProps={{ className: 'post-container' }}>
            {posts.map((post, index) => (
              <div key={post.id} style={{marginBottom: "30px"}}>
                <BlurhashImg 
                  src={post.coverImage} 
                  alt="Post Featured Image" 
                  className="responsive blur_load"
                  id={`clickableImage${post.id}`} 
                  onClick={() => openModal(post.coverImage)} 
                  placeholderColor="#888"
                />
                <p style={{color: "#888"}}>{post.date}</p>
                <h1>{post.title}</h1>
                <p dangerouslySetInnerHTML={{ __html: post.content.length > 250 ? post.content.slice(0, 250) + '...' : post.content }} style={{color: "#888"}}></p>
                <button
                  onClick={() => handleReadMore(post)}
                  style={{ marginTop: '25px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px"}}
                >
                  Read More
                </button>
              </div>
            ))}
          </Masonry>
          <Modal isOpen={modalIsOpen} onRequestClose={closeModal} image={modalImage} />
          {modalPost && <Modale post={modalPost} onClose={() => setModalPost(null)} />}
        </div>
        <WhatGPT3 />
        <div className='ulev__details-video section__padding'>
          <div className="video-container">
            <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
              <source src="https://dl.dropboxusercontent.com/scl/fi/ax4h7mjkvv9xop2wuutsc/Annies-Boutique.mp4?rlkey=qw9nfonhmhzb07m47c2e22h2a&st=i4y3exga&dl=0" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div> 
    </div>
    
  );
}

export default Home;




























// import React, { useState, useRef, useEffect } from 'react';
// import './home.css';
// import { Header, WhatGPT3 } from '../../containers'
// import { Feature, Post } from '../../@/components'
// import play from '../../main_assets/play.png'
// import feature from '../../main_assets/project3.avif'
// import brandbook from '../../main_assets/brandbook.jpg'
// import { Link } from 'react-router-dom';
// import Modale from '../../containers/feed/Feed';
// import axios from 'axios';
// import Masonry from 'react-layout-masonry';
// import LazyLoad from 'react-lazyload';
// import { Blurhash } from 'react-blurhash';
// // import Modal from '../../../@/components/modal/Modal';
// import Modal from '../../@/components/modal/Modal';
// import { excerpt } from '../../@/components/post/excerpt'
// import BlurhashImg from '../../@/components/Image/BlurhashImg';
// import Chinelo from "../../main_assets/Chineloo.avif"


// const Home = () => {
//   const [playing, setPlaying] = useState([false, false, false]);
//   const videoRefs = [useRef(null), useRef(null), useRef(null)];
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [modalPost, setModalPost] = useState(null);
//   const [modalIsOpen, setModalIsOpen] = useState(false);
//   const [modalImage, setModalImage] = useState('');
//   const videoRef = useRef(null);

//   const handlePlaysPauses = () => {
//     if (videoRef.current) {
//       setPlaying(!playing);
//       const video = videoRef.current;

//       if (!playing || video.ended) {
//         video.play();
//         setPlaying(true);
//       } else {
//         video.pause();
//         setPlaying(false);
//       }
//     }
//   }; 

//   const handlePlayPause = (index) => {
//     return () => {
//       if (videoRefs[index].current) {
//         const updatedPlaying = [...playing];
//         updatedPlaying[index] = !playing[index];
//         setPlaying(updatedPlaying);

//         const video = videoRefs[index].current;

//         if (!playing[index] || video.ended) {
//           video.play();
//         } else {
//           video.pause();
//         }
//       }
//     };
//   };

//   // const handlePlayPauseSec = (index) => {
//   //   return () => {
//   //     const updatedPlaying = [...playing];
//   //     updatedPlaying[index] = !playing[index];
//   //     setPlaying(updatedPlaying);
  
//   //     const video = videoRefs[index].current;
  
//   //     if (!playing[index] || video.ended) {
//   //       video.play();
//   //     } else {
//   //       video.pause();
//   //     }
//   //   };
//   // };

//   const handlePlayPauseSec = (index) => {
//     return () => {
//       const updatedPlaying = [...playing];
//       updatedPlaying[index] = !playing[index];
//       setPlaying(updatedPlaying);
  
//       const video = videoRefs[index].current;
  
//       if (!playing[index] || video.ended) {
//         video.play();
//       } else {
//         video.pause();
//       }
//     };
//   };
  
  
  
  

//   const handleVideoEnded = (index) => () => {
//     const updatedPlaying = [...playing];
//     updatedPlaying[index] = false;
//     setPlaying(updatedPlaying);
//   };

//   const openModal = (image) => {
//     setModalImage(image);
//     setModalIsOpen(true);
//   };

//   const closeModal = () => {
//     setModalIsOpen(false);
//   };

//   // const handleReadMore = (index) => {
//   //   const clickedPost = posts[index];
//   //   setModalPost(clickedPost);
//   // };
//   const handleReadMore = (index) => {
//     const clickedPost = posts[index];
//     const postWithImage = { ...clickedPost, image: clickedPost.image };
//     setModalPost(postWithImage);
//   };

//   const handleCategoryChange = (value) => {
//     setSelectedCategory(value);
//   };

//   // const fetchData = async () => {
//   //   try {
//   //     const response = await axios.get('http://localhost/ulevus/wp-json/wp/v2/posts?_embed');
//   //     setPosts(response.data);
//   //   } catch (error) {
//   //     console.error('Error fetching data:', error);
//   //     console.error('Response:', error.response);
//   //   }
//   // };


//   const [posts, setPosts] = useState([
//     {
//       "id": 15,
//       "title": "The Day Design Became Inclusive: Bil Eton’s Journey As An Advocate",
//       excerpt: `They say there are two most important moments in a man's life: the day he's born and the day he discovers his purpose. While this is true, there are also other pivotal moments that spark a shift, a realization that alters the course of one's path. <br/> For Bil Eton, a UI/UX Designer at Iknite Studio, this transformative moment arrived just seven months ago. Attending the TegCampus International Hackathon by Identic Foundation, Malabo 2023 in Equatorial Guinea, Bil's initial focus was on creating an impactful design for a fintech company. <br/><br/> However, the event organizers had a different plan for him. <br/> The organizers challenged participants to build solutions for people with disabilities. To achieve this, Bil interviewed a visually impaired programmer, a conversation that would forever change his design perspective. <br/> "I had to sit down with him and really understand how he navigates his daily life," Bil recounts. "During our conversation, it struck me—we, as designers, have been neglecting a significant portion of the population. That's when the seed of inclusive design was planted in my mind." <br/><br/> Bil's newfound passion propelled him into action. Returning to Cameroon, he was struck by the lack of inclusive design principles in the local design scene. What he once considered "inclusive" design now felt woefully inadequate. He couldn't just stand by – it was time to take action. <br/><br/> <b style="color: #888; font-size: 18px;">Beyond Accessibillity:</b> Designing Products that Empower Users with Disabillities <br/> Bil knew simply raising awareness wasn't enough. He wanted to equip his fellow designers with the knowledge to create products that went beyond basic accessibillity. This realization became the foundation for his presentation at the design meetup in April: "Beyond Accessibillity: Designing Products that Empower Users with Disabillities." <br/><br/> <b style="color: #888; font-size: 18px;">Understanding the Journey</b> <br/> Bil began by introducing the concept of the "Arc of Disabillity," a framework that acknowledges the path people with disabillities navigate throughout their lives. This journey encompasses self-discovery, acceptance, securing support, empowerment, and advocating for rights. Bil emphasized the importance of designing with empathy, considering the different stages a user might be in and how design can support them. <br/><br/> <b style="color: #888; font-size: 18px;">A Spectrum of Needs</b> <br/> Next, Bil addressed the "Spectrum of Disabillities." He highlighted the vast diversity within the disabillity community, encompassing physical, sensory, cognitive, developmental, and mental health conditions. <br/> This spectrum reminds us that a one-size-fits-all approach won't work. Every person's needs and experiences are unique. <br/><br/> <b style="color: #888; font-size: 18px;">Imposed Barriers</b> <br/> Bil challenged the traditional view of disabillity by introducing the concept of "Imposed Disabillity." He argued that disabillity isn't solely about a person's physical or mental impairments. Often, it's the societal barriers that prevent them from fully participating in life. By recognizing these barriers and designing to dismantle them, we can create a more inclusive world. <br/><br/> <b style="color: #888; font-size: 18px;">Temporary vs. Permanent</b> <br/> Bil also differentiated between "Temporary" and "Permanent" disabillities. Temporary disabillities, like a broken bone or illness, may require short-term design solutions. <br> Permanent disabillities, such as blindness or paralysis, demand more long-term considerations.  Understanding these distinctions is crucial for creating adaptable and inclusive products. <br/><br/> <b style="color: #888; font-size: 18px;">Accessibillity vs. Inclusive Design</b> <br/> Bil clarified the relationship between "Accessibillity" and "Inclusive Design." Accessibillity, he explained, is likened to building a ramp – it ensures a specific group, people with disabillities, can access something. It follows established guidelines, like adding subtitles to videos or using good color contrast on websites. <br/><br/> Inclusive Design, on the other hand, is like building a wide sidewalk. It considers everyone's needs from the outset. It caters to a broader range of users, including those with disabillities, slow internet connections, those using mobile phones, or even someone in a noisy environment. <br/> •  Accessibillity is the destination (everyone can use it). <br/> •  Inclusive Design is the journey (considers everyone from the beginning) <br/><br/> <b style="color: #888; font-size: 18px;">Building an Inclusive Future</b> <br/> Bil then outlined a roadmap for achieving Inclusive Design: <br/> •  <b style="color: #888; font-size: 18px;">Team Approach:</b> He stressed the importance of integrating accessibillity considerations from the very beginning of the design process, not as an afterthought. This is akin to building a ramp during construction, rather than adding it later. <br/> •  <b style="color: #888; font-size: 18px;">Brainstorming:</b> Bil recommended collaborative brainstorming sessions with the entire team. The goal is to create a comprehensive picture of potential users – their strengths, limitations, likes, dislikes, and usage contexts. This builds empathy and ensures everyone's needs are considered. <br/> •  <b style="color: #888; font-size: 18px;">Selling the Design:</b> After generating inclusive design ideas, Bil underscored the importance of convincing stakeholders. He advised focusing on the benefits: a larger user base, cost-effectiveness, and a more streamlined development process for the team. <br/><br/> <b style="color: #888; font-size: 18px;">Now It’s Your Turn</b> <br/> Imagine a world where everyone can use the things we create. No one left out! That's the power of inclusive design. By working together, we can design products that anyone can use, no matter what. <br/> This isn't just a small change, it's a big step towards a world that celebrates everyone's unique abillities. Let's make sure everyone has the chance to shine! <br/><br/> Bil concluded, and as designers left the meetup that night, they carried Bil's words with them, forever changed by the power of inclusive design.`,
//       "date": "13th May 2024",
//       "postImage": "https://i.postimg.cc/tyqSdMrH/Bill-2.avif",
//       // modalImage: "url_to_modal_image_1",
//       "categories": [0]
//     },
//     {
//       "id": 14,
//       "title": "From Design Intern To Lead: Chinelo Ojiaku's Journey as a Designer",
//       excerpt: `No one forgets their first; their first job, first paycheck, or first leadership role. For Chinelo Ojiaku, it's her first lead project as a designer at Ulevus. <br/><br/> This pivotal moment marks a significant milestone in her design journey. To capture this experience and celebrate her success, Adewunmi Adeya, Ulevus Communications Strategist, sat down with Chinelo to get an inside look at her first project as a lead designer. <br/><br/> <b style="color: #888; font-size: 18px;">Meet Chinelo Ojiaku</b> <br/> Chinelo's passion for design is clear from the start. "Hi, my name is Chinelo Ojiaku," she beams, “and I chose to be a designer because of my passion for creativity and problem-solving. Designs allow me to blend artistry with functionality to make meaningful impacts." <br/> This hunger for innovation fueled her decision to join Ulevus as an intern in August 2023. But Ulevus wasn't just a workplace; it was a breeding ground for growth and the raising of leaders. Thus, after completing her internship, she stayed back. <br/> "I chose to stay back because of the inspiring work culture, opportunities for growth, and the chance to contribute meaningfully to innovative projects," Chinelo explains. <br/><br/> And contribute, she did. <br/><br/> Less than a year after joining the company, Chinelo was soon offered the opportunity to lead Annie’s Boutique and Costume Jewelry’s project. <br/><br/> <b style="color: #888; font-size: 18px;">Leading with a Blend of Excitement and Responsibility</b> <br/> The news of leading a project was met with mixed emotions for Chinelo. "There was excitement and responsibility," she recalls. It was a chance to showcase her skills and guide the team towards success. This leadership role wasn't entirely unexpected, though. Chinelo viewed it as a natural progression in her career and an exciting challenge she was eager to embrace. <br/><br/> <b style="color: #888; font-size: 18px;">Collaboration and Clear Communication: Key To Success</b> <br/> To ensure the project aligned with Annie's Boutique's goals, Chinelo prioritized clear communication and collaboration. She conducted in-depth client interviews, gathered feedback, and worked closely with them to define project objectives and expectations. <br/> This focus on understanding client needs helped Chinelo in delivering optimal value. <br/> One of Chinelo's proudest achievements was a specific design element that "exceeded client expectations." <br/> However, the journey wasn't without hurdles. Unexpected challenges, like scheduling difficulties with the client and getting the perfect imagery, arose. <br/> Regardless, Chinelo's leadership shone through as she emphasized "effective communication, adaptability, and teamwork" to overcome these obstacles. <br/><br/> <b style="color: #888; font-size: 18px;">Lessons Learned And A Broader Perspective</b><br/> Looking back, Chinelo emphasizes the importance of these same qualities - clear communication, collaboration, adaptability, and remaining client-focused - for success in a lead designer role. <br/> Leading this project also broadened her design perspective. "It exposed me to diverse challenges and solutions," she says. She highlights the importance of user-centric design and staying agile in a constantly evolving environment. <br/><br/> <b style="color: #888; font-size: 18px;">Advice for Aspiring Design Leaders</b> <br/> For those stepping into a lead designer role, Chinelo offers valuable advice: "Embrace challenges, stay organized, communicate effectively, and continuously seek opportunities for growth and learning." <br/><br/> <b style="color: #888; font-size: 18px;"> Teamwork Makes the Dream Work </b> <br> Chinelo's success wasn't achieved alone. She acknowledges the crucial role her colleagues played. "Their expertise, collaboration, and encouragement significantly contributed to achieving our goals," she says. <br/> This collaborative spirit is a hallmark of Ulevus' work culture and a key ingredient in fostering the growth of talented designers like Chinelo Ojiaku.`,
//       "date": "26 April 2024",
//       "postImage": "https://dl.dropboxusercontent.com/scl/fi/u1pubrkiutp4eqqmt4xyx/Chineloo.avif?rlkey=krx6wro2fmzpm8waadn2v0f3g&st=p6ovpibt&dl=0",
//       // modalImage: "url_to_modal_image_1",
//       "categories": [0]
//     },
//     {
//       "id": 1,
//       "title": "5 Signs Your UI/UX Design Is Not User Friendly",
//       excerpt: `Is your user engagement decreasing? Here is why! <br/><br/> User interface (UI) designs are like a cover of a book, people judge it before even knowing the content, so it is essential to adopt seamless user experience design services to impress your users.<br><br>As such, the power of UI design may be the difference between a very successful application and one that fails to make an impression or, worse, leaves a lasting negative impression on the user. You can't afford any UI UX design mistakes! And to help you prevent them and gauge whether your user interface is truly satisfactory, here are five key signs to watch out for.<br><br> <b style="color: #888; font-size: 18px;">1. Complex Navigation:</b> <br>Golden Krishna's philosophy, encapsulated in \"The Best Interface Is No Interface,\" underscores the importance of creating seamless user experiences where navigation occurs so smoothly that users are almost unaware of the interaction. But when this doesn't happen, navigation is complex. Conversely, confusing navigation can frustrate users, and a lack of user-friendliness becomes evident when users struggle to locate information or find their way around features.<br><br><b style="color: #888; font-size: 18px;">2. Inconsistent Design:</b> <br>Inconsistency in design elements, such as varying button styles, color schemes, or placement of key features, can lead to confusion. A lack of visual harmony makes it harder for users to predict the interface's behavior.<br><br><b style="color: #888; font-size: 18px;"> 3. Poor Error Handling:</b> <br>Inadequate or unclear error messages can frustrate users when something goes wrong. If error messages are cryptic, lack guidance, or fail to pinpoint issues, users may struggle to resolve problems effectively.<br><br><b style="color: #888; font-size: 18px;">4. Overwhelming Clutter:</b> <br>An excessively cluttered interface with too much information, options, or visual elements overwhelms users. A cluttered design makes it harder for users to focus on essential tasks and contributes to a less friendly user experience.<br><br><b style="color: #888; font-size: 18px;">5. Lack Of Feedback:</b> <br>If the interface doesn't provide feedback for user actions, such as confirmation messages or visual cues, users may feel uncertain about whether their actions were successful. This lack of feedback can lead to confusion and diminish the overall user experience.<br><br><b style="color: #888; font-size: 18px;">Conclusion:</b> <br>The impact of a poor user experience goes beyond immediate financial costs; it also influences user satisfaction, retention rates, brand reputation, customer loyalty, and overall business success. To mitigate these challenges, it is imperative to invest in user-centered design principles, undertake comprehensive UX research and testing, and consistently iterate based on user feedback.<br>This approach is vital for crafting exceptional user experiences that lead to improved engagement, increased conversions, and a competitive edge in the digital landscape.`,
//       "date": "11 March 2024",
//       "postImage": "https://i.postimg.cc/DF1mKTyh/Article-Pic-imageonline-co-9723919-1.avif",
//       // modalImage: "url_to_modal_image_1",
//       "categories": [0]
//     },
//     {
//       id: 5,
//       title: "The Case for Business Networking",
//       excerpt: `Everyone talks about competitors in business. It's a constant game of chess. Outmaneuvering rivals, pushing them out of the market—or so the traditional narrative goes. <br><br>But what if there's a better way? What if, instead of viewing other businesses solely as adversaries, we saw them as potential co-players in a more giant game of innovation and progress? This collaborative spirit is exactly what fuels the power of business networking.<br><br> <b style="color: #888; font-size: 18px;">Why Is Collaboration Important?</b><br>Think of it this way: wouldn't it be more productive to learn from and inspire each other rather than constantly looking for ways to push each other down? Networking events provide fertile ground for this kind of healthy competition and collaboration.<br><br>At Ulevus, we understand this value, so we're proud to see our Creative Director, Arnold Sigala, actively participating in the business community. <br>Recently, Arnold represented Ulevus as a design judge at the Hustlers Conference Buea, organized by Kouts Divine and the team. This prestigious event brings together creatives, designers, and business leaders, fostering a dynamic environment for networking and learning. <br><br><b style="color: #888; font-size: 18px;">Building Bridges Through Expertise</b><br>Arnold's participation wasn't just about judging designs. It was about connecting with fellow creatives, sharing his expertise, and gaining valuable insights from others. By being present at the Hustlers Conference Buea, Ulevus demonstrates our commitment to:<br>Supporting the creative community: We believe in empowering the next generation of designers and businesses. Events like the Hustlers Conference Buea provide a platform for them to showcase their talent and connect with industry professionals. <br> <b style="color: #888; font-size: 18px;">Fostering collaboration:</b> Business thrives on connections. Participating in these events opens doors to potential partnerships and collaborations, allowing us to learn from others and create even more innovative solutions for our clients.<br><br> <b style="color: #888; font-size: 18px;">Beyond Design</b> <br>Ulevus isn't just about creating stunning brand identities and UI/UX designs; it's about building meaningful connections. We believe that strong relationships are the foundation for successful businesses, and we will continue to reinforce them. <br>Looking to expand your network and take your design skills to the next level? We encourage you to seek out similar events in your area. But if you're in Cameroon, we have some exciting news for you!<br>Mark your calendars for April 16th!  Ulevus is thrilled to host the Ulevus Creative Evening, an electrifying event designed to ignite inspiration, spark knowledge-sharing, and most importantly, foster collaboration amongst designers. To secure your spot, sign up here.`,
//       date: "11 March 2024",
//       postImage: "https://i.postimg.cc/FhnT3Kn5/BN-1.avif",
//       // modalImage: "https://dl.dropboxusercontent.com/scl/fi/btk3fuoich4p1kgqzy0y9/Article-3-Inner-Page-imageonline.co-5111500.avif?rlkey=lc08qnzfttr2rnnv9dw0ca2gc&dl=0",
//       categories: [0]
//     },
    
//     {
//       id: 4,
//       title: "Diversity in Workplace: A Case of Ulevus",
//       excerpt: `In today’s ever-evolving and competitive market, innovation and cutting-edge perspectives are essential for staying ahead of the curve. <br><br>At Ulevus, we recognize this. That's why we don't just encourage fresh ideas—we cultivate them through a deep appreciation for diversity. We see it as the cornerstone of our success. <br><br>Our diverse team are from different countries, cultural background, <br/><br/> languages, and way of thinking, and we thrive on this uniqueness.<br><br><b style="color: #888; font-size: 18px;">Why Is Diversity Important?</b><br>Let's face it: a team with a singular perspective is like a one-note song. It might be catchy, but it lacks depth and the potential for something remarkable.<br><br>At Ulevus, our brainstorming sessions are a symphony of viewpoints. The web developer's expertise merges with the creative director's insights, sparking a chain reaction of ideas that lead to solutions that satisfy our audience, clients, and stakeholders' needs. <br><br>But the power of diversity goes beyond just generating creative solutions. It fosters empathy, a crucial quality in today's globalized market.<br><br>With team members from diverse backgrounds, we gain a deeper understanding of different cultures, challenges, and perspectives. This helps us treat every team member fairly. <br><br>Also, it allows us to craft marketing campaigns that resonate across cultures, develop user-friendly products with a broader appeal, and deliver exceptional customer service that transcends borders.<br><br><b style="color: #888; font-size: 18px;">This Is Just The Beginning</b><br>Building a successful, diverse team isn't a one-time achievement; it's a continuous journey. At Ulevus, we nurture a culture of inclusion and open communication. <br><br>We encourage our team members to challenge assumptions, share their ideas freely, and learn from each other. This ongoing dialogue ensures that we keep reaping the benefits of diversity and staying ahead of the curve.<br><br>By embracing a diverse workforce, you unlock a wellspring of creativity, a deeper understanding of your audience, and the potential to achieve remarkable things. <br><br>So, if you are looking for a dynamic creative team to improve your brand identity and bring your marketing ideas to life, look no further. <br><br>At Ulevus, we don't just brainstorm, we orchestrate. Our diverse team of innovators is fueled by a passion for making your brand shine. If you want to break out of the conventional and bland identity that leaves no lasting impact, look no further. <br><br><b style="color: #888; font-size: 18px;">Embrace the Ulevus Advantage. Let's turn your brand vision into a reality that</b> makes you stand out.`,
//       date: "11 March 2024",
//       postImage: "https://i.postimg.cc/5fs6kS9F/Diversity-Article-1.avif",
//       modalImage: "https://i.postimg.cc/ysXJ0zwj/Diversity-Article-Inner-page-1.avif",
//       categories: [0]
//     },  
//     {
//       "id": 10,
//       "title": "Ulevus Business Evening Buea: The Future of Business.",
//       "excerpt": `In a room buzzing with entrepreneurial energy, the Ulevus Business Evening became a hub of inspiration for seasoned experts and aspiring entrepreneurs. <br/><br/>From tales of starting small to visions of the future, each speaker shared practical advice for building a lasting business. <br/><br/> <b style="color: #888; font-size: 18px;"> Mr. Nanje: Understanding Our Customers</b> <br/> The event kicked off with Mr. Nanje’s speech, a seasoned entrepreneur. He captivated the audience with his early-business-day stories. He began by building websites and tackling the challenges of connecting job seekers with opportunities. Now, with Buyam’s app, he's simplifying the way Africans purchase everyday essentials—all fueled by a deep understanding of his customers. <br/> Mr. Nanje emphasized the importance of knowing our customers, especially in Africa. By understanding their needs and preferences, we can communicate better and build trust. He also highlighted the power of branding, emphasizing that it should reflect who we are trying to reach. <br/><br/> <b style="color: #888; font-size: 18px;"></b> Mr. Nervis: Embracing Innovation <br/> Next up was Mr. Nervis. He ignited the room with his passionate call to embrace innovation. He painted a picture of how AI and other cutting-edge technologies can streamline our lives and propel businesses ahead of the competition. Sharing a personal anecdote about overcoming a tech hurdle, he emphasized the importance of persistence in the face of challenge. Also, he reminded us that standing out from the crowd is essential for building a lasting business. <br/><br/> <b style="color: #888; font-size: 18px;">Madam Tieseh Mirabel: Managing Finances Wisely</b> <br/> To wrap up the evening, Madam Tieseh Mirabel, the evening’s financial guru, equipped attendees with a practical roadmap. From navigating business registration to managing expenses with meticulous detail, her wisdom resonated with aspiring entrepreneurs eager to build a strong financial foundation for their ventures. Her practical tips offered a roadmap for attendees to navigate the financial aspects of their ventures with confidence. <br/><br/> <b style="color: #888; font-size: 18px;">A Source of Inspiration</b> <br/> As attendees left the event, they carried with them a sense of empowerment and determination. The Ulevus Business Evening wasn't about words; it was about practical wisdom and shared experiences. <br/><br/> In a world where success can seem out of reach, these speakers showed that it's possible with hard work, innovation, and a deep understanding of our customers. <br/><br/> As we continue our entrepreneurial journeys, let's remember the lessons learned and strive for excellence in everything we do. <br/><br/> <b style="color: #888; font-size: 18px;">Feedbacks</b> <br/> The positive feedback echoed throughout the halls. <br/> “I'll say that the Ulevus team shouldn't be making their impact. Keep up the great work.” <br/> “Beyond the spectacular teachings, there were more than enough opportunities for networking and interaction at the event.” <br/><br/> <b style="color: #888; font-size: 18px;"> Be the first to know about the next Ulevus Business Evening event. Sign up here.</b>`,
//       "date": "02 April 2024",
//       "postImage": "https://i.postimg.cc/KmcG25Xm/Ulevus-Business-Evening-Buea.avif",
//       // "modalImage": "https://dl.dropboxusercontent.com/scl/fi/vld95tgenfa5j3k161woz/Diversity-Article-Inner-page.avif?rlkey=ktzzrn20y0eizq5jaloryu185&dl=0",
//       "categories": [1]
//     },
//   ]);

//   // useEffect(() => {
//   //   axios
//   //     .get('http://localhost/ulevus/wp-json/wp/v2/categories')
//   //     .then((res) => {
//   //       const excludedCategories = ['Uncategorized', 'Articles', 'Talks'];
//   //       const filteredCategories = res.data.filter(
//   //         (category) => !excludedCategories.includes(category.name)
//   //       );
//   //       setCategories(filteredCategories);
//   //     })
//   //     .catch((error) => {
//   //       console.error('Error fetching categories:', error);
//   //     });

//   //   fetchData();
//   // }, []);

//   // const filterPosts = () => {
//   //   if (selectedCategory === 'all') {
//   //     return posts.slice(0, 6);
//   //   }

//   //   // return posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
//   //   const filteredPosts = posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
//   //   return filteredPosts.slice(0, 6);
//   // };

//   const filterPosts = () => {
//     if (selectedCategory === 'all') {
//       return posts;
//     }
//     return posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
//   };

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.setAttribute('muted', true);
//     }
//   }, []);

//   const [imageLoaded, setImageLoaded] = useState(false);

//   const handleImageLoad = () => {
//     setImageLoaded(true);
//   };

//   return (
//     <div className="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <div className='carousel'>
//         <Header />
//         <Link to="/work/echolink-solutions" className="home_project-cards" id='newwest'>
//           <div className="home_project-image" >
//             <BlurhashImg src="https://i.postimg.cc/51bb1WWr/Silicon-1.avif" placeholderColor="#888"/>
//             <div className="home_overlay">
//               <h2>Echolink Solutions</h2>
//               <p>Brand Identity, Website</p>
//               <p>USA</p>
//             </div>
//           </div>
//         </Link>
//         <Link to="/work/apprey-public-relations-pr" className="home_project-cards" id='newwest'>
//           <div className="home_project-image" >
//             <BlurhashImg src="https://i.postimg.cc/vbRQjxHW/Apprey-1.avif" placeholderColor="#888"/>
//             <div className="home_overlay">
//               <h2>Apprey Public Relations</h2>
//               <p>Brand Identity, Design Implementation</p>
//               <p>Chicago - USA</p>
//             </div>
//           </div>
//         </Link>
//         <Link to="/work/editi" className="home_project-cards" id='newwest'>
//           <div className="home_project-image" >
//             <BlurhashImg src="https://i.postimg.cc/q48CZT0v/Editi-1.avif" placeholderColor="#888"/>
//             <div className="home_overlay">
//               <h2>Electronic Data interchange Technology Institute (EDITI)</h2>
//               <p>Brand Identity</p>
//               <p>Washington - USA</p>
//             </div>
//           </div>
//         </Link>
//         <Link to="/work/Lewa" className="home_project-cards" id='newwest'>
//           <div className="home_project-image" >
//             <BlurhashImg src="https://i.postimg.cc/hSGsBjPr/Lewa-1.avif" placeholderColor="#888"/>
//             <div className="home_overlay">
//               <h2>Lewa</h2>
//               <p>Brand Identity, Design Implementation, Naming</p>
//               <p>Cameroon - Africa</p>
//             </div>
//           </div>
//         </Link>
//         {/* <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <LazyLoad offset={100}>
//               <video
//                 ref={videoRef}
//                 loop
//                 autoPlay
//                 playsInline 
//                 controls
//                 width="100%"
//                 height="600px"
//                 style={{ objectFit: 'cover' }}
//                 onEnded={handleVideoEnded}
//                 onPause={handlePlayPauseSec}
//               >
//                 <source src="https://dl.dropboxusercontent.com/scl/fi/09dg558gscipi5bqrs75i/brand_vid.mp4?rlkey=7gw9it2ewmsqgtd840t61g7xc&dl=0" type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             </LazyLoad>
//           </div>
//         </div> */}
//         {/* <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <video ref={videoRefs[0]} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded(0)} onPause={handlePlayPause(0)}>
//               <source src="https://dl.dropboxusercontent.com/scl/fi/y48pqjm0vrb74o52nt759/abstract.50333a9a9404b37f18ce.mp4?rlkey=7p0fda998qm47po6hihyiing1&dl=0" type="video/mp4" />
//               Your browser does not support the video tag.
//             </video>
//             {!playing[0] && (
//               <div className="video-overlay" onClick={handlePlayPause(0)}>
//                 <img src={play} className="img-fluid" alt="video-preview-img" />
//                 <div className="text-overlay">
//                   <h3>Coronawash Commision</h3>
//                   <p>Website, UI/UX</p>
//                   <p>Florida - USA</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <video ref={videoRefs[1]} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded(0)} onPause={handlePlayPause(0)}>
//               <source src="https://dl.dropboxusercontent.com/scl/fi/3zad3vwq7pdgae3rd9viz/smoke.7d2ab9144dd6afc4980e.mp4?rlkey=354a7iwejwf1e53s8uvayzdun&dl=0" type="video/mp4" />
//               Your browser does not support the video tag.
//             </video>
//             {!playing[1] && (
//               <div className="video-overlay" onClick={handlePlayPause(0)}>
//                 <img src={play} className="img-fluid" alt="video-preview-img" />
//                 <div className="text-overlay">
//                   <h3>Coronawash Commision</h3>
//                   <p>Website, UI/UX</p>
//                   <p>Florida - USA</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <video ref={videoRefs[2]} controls width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded(0)} onPause={handlePlayPause(0)}>
//               <source src="https://dl.dropboxusercontent.com/scl/fi/y48pqjm0vrb74o52nt759/abstract.50333a9a9404b37f18ce.mp4?rlkey=7p0fda998qm47po6hihyiing1&dl=0" type="video/mp4" />
//               Your browser does not support the video tag.
//             </video>
//             {!playing[2] && (
//               <div className="video-overlay" onClick={handlePlayPause(0)}>
//                 <img src={play} className="img-fluid" alt="video-preview-img" />
//                 <div className="text-overlay">
//                   <h3>Coronawash Commision</h3>
//                   <p>Website, UI/UX</p>
//                   <p>Florida - USA</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div> */}
//         <Feature />
//         {/* <Post /> */}
//         <div className="post-grid">
//           <div className="category-buttons">
//             <button className='btn'> Articles</button>
//             <button className='btn2' style={{marginLeft: 'auto'}}>
//               <Link to="/learn" style={{ textDecoration: 'underline', color: 'white' }}>
//                 see more
//               </Link>
//             </button>
//           </div>
//           <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={16} columnProps={{ className: 'post-container' }}>
//             {filterPosts().map((post, index) => (
//               <div key={post.id} style={{marginBottom: "30px"}}>
//                 <BlurhashImg 
//                   src={post.postImage} 
//                   alt="Post Featured Image" 
//                   className="responsive blur_load"
//                   id={`clickableImage${post.id}`} 
//                   onClick={() => openModal(post.postImage)} 
//                   placeholderColor="#888"
//                 />
//                 {/* <img
//                   src={post.postImage}
//                   alt="Post Featured Image"
//                   className="responsive blur_load"
//                   id={`clickableImage${post.id}`}
//                   loading="lazy"
//                   // onClick={() => openModal(post.postImage)}
//                 /> */}
//                 <p style={{color: "#888"}}>{post.date}</p>
//                 <h1>{post.title}</h1>
//                 <p dangerouslySetInnerHTML={{ __html: post.excerpt.length > 250 ? post.excerpt.slice(0, 250) : post.excerpt }} style={{color: "#888"}}></p>
//                 {/* <p style={{ color: 'white' }}>
//                   {post.excerpt.length > 250 ? post.excerpt.slice(0, 250) : post.excerpt}
//                 </p> */}
//                 <button
//                   onClick={() => handleReadMore(index)}
//                   style={{ marginTop: '25px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px"}}
//                 >
//                   Read More
//                 </button>
//               </div>
//             ))}
//           </Masonry>
//           <Modal isOpen={modalIsOpen} onRequestClose={closeModal} image={modalImage} />
//           {modalPost && <Modale post={modalPost} onClose={() => setModalPost(null)} />}
//         </div>
//         <WhatGPT3 />
//         <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
//               <source src="https://dl.dropboxusercontent.com/scl/fi/ax4h7mjkvv9xop2wuutsc/Annies-Boutique.mp4?rlkey=qw9nfonhmhzb07m47c2e22h2a&st=i4y3exga&dl=0" type="video/mp4" />
//               Your browser does not support the video tag.
//             </video>
//             {/* {!playing && (
//               <div className="video-overlay" onClick={handlePlayPause}>
//                 <img src={play} className="img-fluid" alt="video-preview-img" />
//               </div>
//             )} */}
//           </div>
//         </div>
//         {/* <div className='ulev__details-video section__padding'>
//           <div className="video-container">
//             <video ref={videoRef} controls autoPlay loop width="100%" height="600px" style={{ objectFit: 'cover' }} onEnded={handleVideoEnded} onPause={handlePlayPause}>
//               <source src="https://dl.dropboxusercontent.com/scl/fi/ax4h7mjkvv9xop2wuutsc/Annies-Boutique.mp4?rlkey=qw9nfonhmhzb07m47c2e22h2a&st=i4y3exga&dl=0" type="video/mp4" />
//               Your browser does not support the video tag.
//             </video>
//           </div>
//         </div> */}
//       </div> 
//     </div>
    
//   );
// }

// export default Home;

