// import React from 'react';
// import { useParams } from 'react-router-dom';
// import Project0Details from './echolink-solutions';
// import Project1Details from './ideal-farmers-yought-recognition-awards';
// import Project2Details from './apprey-public-relations-pr';
// import Project3Details from './silicon-mountain-conference-2023';
// import Project4Details from './Lewa';
// import Project5Details from './editi';
// import Project6Details from './purpose';
// import Project7Details from './alani';
// import Project8Details from './mayen-spices';
// import Project9Details from './ulevus-brand-book-version-1-0';
// import Project11Details from './african-rooted';
// import Project12Details from './sontech';
// import Project13Details from './house-of-sigala';
// import Project14Details from './eagle-wings';
// import Project15Details from './rumi-sir';
// import Project16Details from './annies-boutique';
// import Project17Details from './lgv-gas-systems';

// const ProjectDetails = () => {
//   const { projectSlug } = useParams();

//   const getProjectComponent = (slug) => {
//     switch(slug) {
//       case 'lgv-gas-systems':
//         return <Project17Details />;
//       case 'annies-boutique':
//         return <Project16Details />;
//       case 'echolink-solutions':
//         return <Project0Details />;
//       case 'ideal-farmers-yought-recognition-awards':
//         return <Project1Details />;
//       case 'apprey-public-relations-pr':
//         return <Project2Details />;
//       case 'silicon-mountain-conference-2023':
//         return <Project3Details />;
//       case 'Lewa':
//         return <Project4Details />;
//       case 'editi':
//         return <Project5Details />;
//       case 'purpose':
//         return <Project6Details />;
//       case 'alani':
//         return <Project7Details />;
//       case 'mayen-spices':
//         return <Project8Details />;
//       case 'ulevus-brand-book-version-1-0':
//         return <Project9Details />;
//       case 'african-rooted':
//         return <Project11Details />;
//       case 'sontech':
//         return <Project12Details />;
//       case 'house-of-sigala':
//         return <Project13Details />;
//       case 'eagle-wings':
//         return <Project14Details />;
//       case 'rumi-sir':
//         return <Project15Details />;
//       default:
//         return <div>Project not found</div>;
//     }
//   };

//   return getProjectComponent(projectSlug);
// };

// export default ProjectDetails;






// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { projectId } = useParams();

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         console.log('Fetching project with ID:', projectId);
//         if (!projectId) {
//           throw new Error('projectId is undefined');
//         }
        
//         const projectRef = doc(db, 'projects', projectId);
//         const projectSnap = await getDoc(projectRef);
        
//         if (projectSnap.exists()) {
//           console.log('Project data:', projectSnap.data());
//           setProject({ id: projectSnap.id, ...projectSnap.data() });
//         } else {
//           throw new Error('No such project!');
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProject();
//   }, [projectId]);

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'column'}}>
//           <h1>{project.title || 'No Title'}</h1>
//           <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//         </div>
//         <p style={{ marginBottom: "auto" }}>
//           {project.description || 'No Description'}
//           <br/>
//           {project.location || 'No Location'}
//         </p>
//       </div>

//       {project.coverImage && (
//         <div className='ulev__details-images section__padding'>
//           <div className="single-image-section">
//             <BlurhashImg src={project.coverImage} placeholderColor="#888"/>
//           </div>
//         </div>
//       )}

//       {project.caseReview && (
//         <div className="ulev_morePD section__padding" id="wgpt3">
//           <div className="ulev_morePD-contain section__padding">
//             <p className='ulev_morePD-p'>
//               <h1>CASE REVIEW:</h1>
//               <div dangerouslySetInnerHTML={{ __html: project.caseReview }} />
//             </p>
//           </div>
//         </div>
//       )}

//       {project.projectImages && project.projectImages.length > 0 && (
//         <div className='ulev__details-images section__padding'>
//           {project.projectImages.map((image, index) => (
//             <div key={index} className="single-image-section">
//               <BlurhashImg src={image} placeholderColor="#888"/>
//             </div>
//           ))}
//         </div>
//       )}

//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className='related'>Other Projects</h1>
//           {project.relatedProjects.map((relatedProject, index) => (
//             <Link key={index} to={`/work/${relatedProject.id}`} className="related-card">
//               <div className="related-image-container">
//                 <LazyLoad>
//                   <img src={relatedProject.coverImage} alt={relatedProject.title} className="related-image" />
//                 </LazyLoad>
//                 <div className="overlay">
//                   <h2>{relatedProject.title}</h2>
//                   <p>{relatedProject.description}</p>
//                   <p>{relatedProject.location}</p>
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;












// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { projectId } = useParams();

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         console.log('Fetching project with ID:', projectId);
//         if (!projectId) {
//           throw new Error('projectId is undefined');
//         }
        
//         const projectRef = doc(db, 'projects', projectId);
//         const projectSnap = await getDoc(projectRef);
        
//         if (projectSnap.exists()) {
//           console.log('Project data:', projectSnap.data());
//           setProject({ id: projectSnap.id, ...projectSnap.data() });
//         } else {
//           throw new Error('No such project!');
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProject();
//   }, [projectId]);

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   const renderContent = (content) => {
//     if (typeof content === 'string') {
//       return content.split(',').map(item => item.trim());
//     }
//     return Array.isArray(content) ? content : [content];
//   };

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
//           <div>
//             <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
//             <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//           </div>
//           <div className='ulev__details-description' style={{ textAlign: 'right' }}>
//             <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
//           </div>
//         </div>
//       </div>

//       {project.coverMedia && (
//         <div className='ulev__details-images' style={{padding: "0rem 4rem 0rem 4rem"}}>
//           <div className="single-image-section">
//             {project.coverMedia.type === 'video' ? (
//               <video controls width="100%">
//                 <source src={project.coverMedia.url} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : (
//               <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
//             )}
//           </div>
//         </div>
//       )}

//       {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
//         <div key={index} className="ulev_morePD " id={`section-${index}`}>
//           {section.type === 'text' && (
//             <div className="ulev_morePD-contain sectiona__padding">
//               <p className='ulev_morePD-other'></p>
//               <div className='ulev_morePD-p'>
//                 <div 
//                   dangerouslySetInnerHTML={{ __html: section.content }} 
//                   className="ulev_morePD-content"
//                   style={{color: "#fff"}}
//                 />
//               </div>
//             </div>
//           )}
//           {/* {section.type === 'image' && section.layout === 'double' && (
//             <div className='ulev__details-images ulev__details-images-double' style={{padding: "4rem 4rem 4rem 4rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )} */}
//           {section.type === 'image' && section.layout !== 'double' && (
//             <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'image_pair' && (
//             <div className='ulev__details-image-pair sectionass__padding'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-image-section'>
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout === 'double' && (
//             <div className='ulev__details-images section__padding ulev__details-images-double'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video controls>
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}

//           {section.type === 'video' && section.layout !== 'double' && (
//             <div className='ulev__details-images ' style={{padding: "4rem 4rem 4rem 4rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video controls>
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video_pair' && (
//             <div className='ulev__details-video-pair sectiona__padding-vid'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-video-section'>
//                   <video controls>
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={`/work/${relatedProject.id}`} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;






// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { projectId } = useParams();
//   const videoRefs = useRef({});
//   const [playingVideos, setPlayingVideos] = useState({});

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         console.log('Fetching project with ID:', projectId);
//         if (!projectId) {
//           throw new Error('projectId is undefined');
//         }
        
//         const projectRef = doc(db, 'projects', projectId);
//         const projectSnap = await getDoc(projectRef);
        
//         if (projectSnap.exists()) {
//           console.log('Project data:', projectSnap.data());
//           setProject({ id: projectSnap.id, ...projectSnap.data() });
//         } else {
//           throw new Error('No such project!');
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProject();
//   }, [projectId]);

//   useEffect(() => {
//     // Set up Intersection Observer for videos
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             const video = entry.target;
//             video.play().catch(error => console.error('Error playing video:', error));
//             setPlayingVideos(prev => ({ ...prev, [video.id]: true }));
//           } else {
//             const video = entry.target;
//             video.pause();
//             setPlayingVideos(prev => ({ ...prev, [video.id]: false }));
//           }
//         });
//       },
//       { threshold: 0.5 }
//     );

//     // Observe all video elements
//     Object.values(videoRefs.current).forEach(video => {
//       if (video) observer.observe(video);
//     });

//     return () => {
//       Object.values(videoRefs.current).forEach(video => {
//         if (video) observer.unobserve(video);
//       });
//     };
//   }, [project]);

//   const handlePlayPause = (videoId) => {
//     const video = videoRefs.current[videoId];
//     if (video) {
//       if (playingVideos[videoId]) {
//         video.pause();
//       } else {
//         video.play().catch(error => console.error('Error playing video:', error));
//       }
//       setPlayingVideos(prev => ({ ...prev, [videoId]: !prev[videoId] }));
//     }
//   };

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   const renderContent = (content) => {
//     if (typeof content === 'string') {
//       return content.split(',').map(item => item.trim());
//     }
//     return Array.isArray(content) ? content : [content];
//   };

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
//           <div className='ulev__details-title-big'>
//             <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
//             <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//           </div>
//           <div className='ulev__details-description' style={{ textAlign: 'right' }}>
//             <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
//           </div>
//         </div>
//       </div>

//       {project.coverMedia && (
//         <div className='ulev__details-images' style={{padding: "2rem 4rem 0rem 4rem"}}>
//           <div className="single-image-section">
//             {project.coverMedia.type === 'video' ? (
//               <video
//                 ref={el => videoRefs.current['cover'] = el}
//                 id="cover"
//                 loop
//                 autoPlay
//                 muted
//                 playsInline
//                 onClick={() => handlePlayPause('cover')}
//                 style={{ cursor: 'pointer' }}
//               >
//                 <source src={project.coverMedia.url} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : (
//               <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
//             )}
//           </div>
//         </div>
//       )}

//       {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
//         <div key={index} className="ulev_morePD " id={`section-${index}`}>
//           {section.type === 'text' && (
//             <div className="ulev_morePD-contain sectiona__padding">
//               <p className='ulev_morePD-other'></p>
//               <div className='ulev_morePD-p'>
//                 <div 
//                   dangerouslySetInnerHTML={{ __html: section.content }} 
//                   className="ulev_morePD-content"
//                   style={{color: "#fff"}}
//                 />
//               </div>
//             </div>
//           )}
//           {section.type === 'image' && section.layout !== 'double' && (
//             <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'image_pair' && (
//             <div className='ulev__details-image-pair sectionass__padding'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-image-section'>
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout === 'double' && (
//             <div className='ulev__details-images section__padding ulev__details-images-double'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
//                     id={`video-${index}-${idx}`}
//                     loop
//                     autoPlay
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout !== 'double' && (
//             <div className='ulev__details-images ' style={{padding: "4rem 4rem 4rem 4rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
//                     id={`video-${index}-${idx}`}
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video_pair' && (
//             <div className='ulev__details-video-pair sectiona__padding-vid'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-video-section'>
//                   <video
//                     ref={el => videoRefs.current[`video-pair-${index}-${idx}`] = el}
//                     id={`video-pair-${index}-${idx}`}
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-pair-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={`/work/${relatedProject.id}`} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;




import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './projectDetails.css';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug } = useParams();
  const videoRefs = useRef({});
  const [playingVideos, setPlayingVideos] = useState({});

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('Fetching project with slug or ID:', slug);
        if (!slug) {
          throw new Error('Slug or ID is undefined');
        }

        let projectData;

        // First, try to fetch by slug
        const projectRef = collection(db, 'projects');
        const q = query(projectRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          projectData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        } else {
          // If not found by slug, try to fetch by ID
          const docRef = doc(db, 'projects', slug);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            projectData = { id: docSnap.id, ...docSnap.data() };
          } else {
            throw new Error('No project found for this slug or ID!');
          }
        }

        console.log('Project data:', projectData);
        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(error => console.error('Error playing video:', error));
            setPlayingVideos(prev => ({ ...prev, [video.id]: true }));
          } else {
            video.pause();
            setPlayingVideos(prev => ({ ...prev, [video.id]: false }));
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(videoRefs.current).forEach(video => {
      if (video) observer.observe(video);
    });

    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video) observer.unobserve(video);
      });
    };
  }, [project]);

  const handlePlayPause = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (playingVideos[videoId]) {
        video.pause();
      } else {
        video.play().catch(error => console.error('Error playing video:', error));
      }
      setPlayingVideos(prev => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  };

  if (loading) return <div>Loading project details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>No project found</div>;

  const renderContent = (content) => {
    if (typeof content === 'string') {
      return content.split(',').map(item => item.trim());
    }
    return Array.isArray(content) ? content : [content];
  };

  const getProjectLink = (relatedProject) => {
    return relatedProject.slug ? `/work/${relatedProject.slug}` : `/work/${relatedProject.id}`;
  };

  return (
    <div className='ulev_details'>
      <div className="ulev__details-title section__padding">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
          <div className='ulev__details-title-big'>
            <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
            <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
          </div>
          <div className='ulev__details-description' style={{ textAlign: 'right' }}>
            <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
          </div>
        </div>
      </div>

      {project.coverMedia && (
        <div className='ulev__details-images' style={{padding: "2rem 4rem 0rem 4rem"}}>
          <div className="single-image-section">
            {project.coverMedia.type === 'video' ? (
              <video
                ref={el => videoRefs.current['cover'] = el}
                id="cover"
                loop
                autoPlay
                muted
                playsInline
                onClick={() => handlePlayPause('cover')}
                style={{ cursor: 'pointer' }}
              >
                <source src={project.coverMedia.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
            )}
          </div>
        </div>
      )}

      {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
        <div key={index} className="ulev_morePD " id={`section-${index}`}>
          {section.type === 'text' && (
            <div className="ulev_morePD-contain sectiona__padding">
              <p className='ulev_morePD-other'></p>
              <div className='ulev_morePD-p'>
                <div 
                  dangerouslySetInnerHTML={{ __html: section.content }} 
                  className="ulev_morePD-content"
                  style={{color: "#fff"}}
                />
              </div>
            </div>
          )}
          {section.type === 'image' && section.layout !== 'double' && (
            <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
              {renderContent(section.content).map((url, idx) => (
                <div key={idx} className="single-image-section">
                  <BlurhashImg src={url} placeholderColor="#888"/>
                </div>
              ))}
            </div>
          )}
          {section.type === 'image_pair' && (
            <div className='ulev__details-image-pair sectionass__padding'>
              {renderContent(section.content).map((url, idx) => (
                <div key={idx} className='half-image-section'>
                  <BlurhashImg src={url} placeholderColor="#888"/>
                </div>
              ))}
            </div>
          )}
          {section.type === 'video' && section.layout === 'double' && (
            <div className='ulev__details-images section__padding ulev__details-images-double'>
              {renderContent(section.content).map((url, idx) => (
                <div key={idx} className="single-image-section">
                  <video
                    ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
                    id={`video-${index}-${idx}`}
                    loop
                    autoPlay
                    muted
                    playsInline
                    onClick={() => handlePlayPause(`video-${index}-${idx}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <source src={url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
          {section.type === 'video' && section.layout !== 'double' && (
            <div className='ulev__details-images ' style={{padding: "4rem 4rem 4rem 4rem"}}>
              {renderContent(section.content).map((url, idx) => (
                <div key={idx} className="single-image-section">
                  <video
                    ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
                    id={`video-${index}-${idx}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onClick={() => handlePlayPause(`video-${index}-${idx}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <source src={url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
          {section.type === 'video_pair' && (
            <div className='ulev__details-video-pair sectiona__padding-vid'>
              {renderContent(section.content).map((url, idx) => (
                <div key={idx} className='half-video-section'>
                  <video
                    ref={el => videoRefs.current[`video-pair-${index}-${idx}`] = el}
                    id={`video-pair-${index}-${idx}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onClick={() => handlePlayPause(`video-pair-${index}-${idx}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <source src={url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* {project.relatedProjects && project.relatedProjects.length > 0 && (
        <div className="related-container section__padding">
          <h1 className="related">Related Projects</h1>
          <div className="related-projects-grid">
            {project.relatedProjects.map((relatedProject, index) => (
              <Link key={index} to={getProjectLink(relatedProject)} className="related-card">
                <div className="related-image-container">
                  <LazyLoad>
                    <img
                      src={relatedProject.coverImage}
                      alt={relatedProject.title}
                      className="related-image"
                    />
                  </LazyLoad>
                  <div className="overlay">
                    <h2 className="related-title">{relatedProject.title}</h2>
                    <p className="related-subtitle">{relatedProject.description || ''}</p>
                    <p className="related-location">{relatedProject.location || ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )} */}
      {project.relatedProjects && project.relatedProjects.length > 0 && (
        <div className="related-container section__padding">
          <h1 className="related">Related Projects</h1>
          <div className="related-projects-grid">
            {project.relatedProjects.map((relatedProject, index) => (
              <Link key={index} to={`/work/${relatedProject.slug}`} className="related-card">
                <div className="related-image-container">
                  <LazyLoad>
                    <img
                      src={relatedProject.coverImage}
                      alt={relatedProject.title}
                      className="related-image"
                    />
                  </LazyLoad>
                  <div className="overlay">
                    <h2 className="related-title">{relatedProject.title}</h2>
                    <p className="related-subtitle">{relatedProject.description || ''}</p>
                    <p className="related-location">{relatedProject.location || ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )} 
    </div>
  );
};

export default ProjectDetails;





// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { slug } = useParams();
//   const videoRefs = useRef({});
//   const [playingVideos, setPlayingVideos] = useState({});

//   // useEffect(() => {
//   //   const fetchProjectBySlug = async () => {
//   //     try {
//   //       console.log('Fetching project with slug:', slug);
//   //       if (!slug) {
//   //         throw new Error('Slug is undefined');
//   //       }

//   //       // Query Firestore collection 'projects' for a document where 'slug' matches the given slug
//   //       const projectRef = collection(db, 'projects');
//   //       const q = query(projectRef, where('slug', '==', slug));
//   //       const querySnapshot = await getDocs(q);

//   //       if (!querySnapshot.empty) {
//   //         const projectData = querySnapshot.docs[0].data(); // Assuming only one document matches the slug
//   //         console.log('Project data:', projectData);
//   //         setProject({ id: querySnapshot.docs[0].id, ...projectData });
//   //       } else {
//   //         throw new Error('No project found for this slug!');
//   //       }
//   //     } catch (error) {
//   //       console.error('Error fetching project:', error);
//   //       setError(error.message);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchProjectBySlug();
//   // }, [slug]);

//   useEffect(() => {
//     const fetchProjectBySlug = async () => {
//       try {
//         console.log('Fetching project with slug:', slug);
//         if (!slug) {
//           throw new Error('Slug is undefined');
//         }
  
//         const projectRef = collection(db, 'projects');
//         const q = query(projectRef, where('slug', '==', slug));
//         const querySnapshot = await getDocs(q);
  
//         if (!querySnapshot.empty) {
//           const projectData = querySnapshot.docs[0].data();
//           console.log('Project data:', projectData);
//           setProject({ id: querySnapshot.docs[0].id, ...projectData });
//         } else {
//           console.warn('No project found for this slug:', slug);
//           throw new Error('No project found for this slug!');
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchProjectBySlug();
//   }, [slug]);
  
//   const getProjectLink = (project) => {
//     return project.slug ? `/work/${project.slug}` : `/work/${project.id}`;
//   };

//   useEffect(() => {
//     // Intersection Observer setup for videos
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           const video = entry.target;
//           if (entry.isIntersecting) {
//             video.play().catch(error => console.error('Error playing video:', error));
//             setPlayingVideos(prev => ({ ...prev, [video.id]: true }));
//           } else {
//             video.pause();
//             setPlayingVideos(prev => ({ ...prev, [video.id]: false }));
//           }
//         });
//       },
//       { threshold: 0.5 }
//     );

//     // Observe all video elements
//     Object.values(videoRefs.current).forEach(video => {
//       if (video) observer.observe(video);
//     });

//     return () => {
//       Object.values(videoRefs.current).forEach(video => {
//         if (video) observer.unobserve(video);
//       });
//     };
//   }, [project]);

//   const handlePlayPause = (videoId) => {
//     const video = videoRefs.current[videoId];
//     if (video) {
//       if (playingVideos[videoId]) {
//         video.pause();
//       } else {
//         video.play().catch(error => console.error('Error playing video:', error));
//       }
//       setPlayingVideos(prev => ({ ...prev, [videoId]: !prev[videoId] }));
//     }
//   };

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   const renderContent = (content) => {
//     if (typeof content === 'string') {
//       return content.split(',').map(item => item.trim());
//     }
//     return Array.isArray(content) ? content : [content];
//   };

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
//           <div className='ulev__details-title-big'>
//             <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
//             <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//           </div>
//           <div className='ulev__details-description' style={{ textAlign: 'right' }}>
//             <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
//           </div>
//         </div>
//       </div>

//       {project.coverMedia && (
//         <div className='ulev__details-images' style={{padding: "2rem 4rem 0rem 4rem"}}>
//           <div className="single-image-section">
//             {project.coverMedia.type === 'video' ? (
//               <video
//                 ref={el => videoRefs.current['cover'] = el}
//                 id="cover"
//                 loop
//                 autoPlay
//                 muted
//                 playsInline
//                 onClick={() => handlePlayPause('cover')}
//                 style={{ cursor: 'pointer' }}
//               >
//                 <source src={project.coverMedia.url} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : (
//               <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
//             )}
//           </div>
//         </div>
//       )}

//       {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
//         <div key={index} className="ulev_morePD " id={`section-${index}`}>
//           {section.type === 'text' && (
//             <div className="ulev_morePD-contain sectiona__padding">
//               <p className='ulev_morePD-other'></p>
//               <div className='ulev_morePD-p'>
//                 <div 
//                   dangerouslySetInnerHTML={{ __html: section.content }} 
//                   className="ulev_morePD-content"
//                   style={{color: "#fff"}}
//                 />
//               </div>
//             </div>
//           )}
//           {section.type === 'image' && section.layout !== 'double' && (
//             <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {/* The rest of your sections */}
//         </div>
//       ))}

//       {/* {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={`/work/${relatedProject.slug}`} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )} */}
//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={getProjectLink(relatedProject)} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;











// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { projectTitle } = useParams();
//   const videoRefs = useRef({});
//   const [playingVideos, setPlayingVideos] = useState({});

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         console.log('Fetching project with title:', projectTitle);
//         if (!projectTitle) {
//           throw new Error('projectTitle is undefined');
//         }
        
//         const projectsRef = collection(db, 'projects');
//         const q = query(projectsRef, where("slug", "==", projectTitle));
//         const querySnapshot = await getDocs(q);
        
//         if (!querySnapshot.empty) {
//           const projectDoc = querySnapshot.docs[0];
//           console.log('Project data:', projectDoc.data());
//           setProject({ id: projectDoc.id, ...projectDoc.data() });
//         } else {
//           throw new Error('No such project!');
//         }
//       } catch (error) {
//         console.error('Error fetching project:', error);
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProject();
//   }, [projectTitle]);

//   useEffect(() => {
//     // Set up Intersection Observer for videos
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             const video = entry.target;
//             video.play().catch(error => console.error('Error playing video:', error));
//             setPlayingVideos(prev => ({ ...prev, [video.id]: true }));
//           } else {
//             const video = entry.target;
//             video.pause();
//             setPlayingVideos(prev => ({ ...prev, [video.id]: false }));
//           }
//         });
//       },
//       { threshold: 0.5 }
//     );

//     // Observe all video elements
//     Object.values(videoRefs.current).forEach(video => {
//       if (video) observer.observe(video);
//     });

//     return () => {
//       Object.values(videoRefs.current).forEach(video => {
//         if (video) observer.unobserve(video);
//       });
//     };
//   }, [project]);

//   const handlePlayPause = (videoId) => {
//     const video = videoRefs.current[videoId];
//     if (video) {
//       if (playingVideos[videoId]) {
//         video.pause();
//       } else {
//         video.play().catch(error => console.error('Error playing video:', error));
//       }
//       setPlayingVideos(prev => ({ ...prev, [videoId]: !prev[videoId] }));
//     }
//   };

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   const renderContent = (content) => {
//     if (typeof content === 'string') {
//       return content.split(',').map(item => item.trim());
//     }
//     return Array.isArray(content) ? content : [content];
//   };

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
//           <div>
//             <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
//             <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//           </div>
//           <div className='ulev__details-description' style={{ textAlign: 'right' }}>
//             <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
//           </div>
//         </div>
//       </div>

//       {project.coverMedia && (
//         <div className='ulev__details-images' style={{padding: "4rem 4rem 0rem 4rem"}}>
//           <div className="single-image-section">
//             {project.coverMedia.type === 'video' ? (
//               <video
//                 ref={el => videoRefs.current['cover'] = el}
//                 id="cover"
//                 loop
//                 autoPlay
//                 muted
//                 playsInline
//                 onClick={() => handlePlayPause('cover')}
//                 style={{ cursor: 'pointer' }}
//               >
//                 <source src={project.coverMedia.url} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : (
//               <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
//             )}
//           </div>
//         </div>
//       )}

//       {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
//         <div key={index} className="ulev_morePD " id={`section-${index}`}>
//           {section.type === 'text' && (
//             <div className="ulev_morePD-contain sectiona__padding">
//               <p className='ulev_morePD-other'></p>
//               <div className='ulev_morePD-p'>
//                 <div 
//                   dangerouslySetInnerHTML={{ __html: section.content }} 
//                   className="ulev_morePD-content"
//                   style={{color: "#fff"}}
//                 />
//               </div>
//             </div>
//           )}
//           {section.type === 'image' && section.layout !== 'double' && (
//             <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'image_pair' && (
//             <div className='ulev__details-image-pair sectionass__padding'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-image-section'>
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout === 'double' && (
//             <div className='ulev__details-images section__padding ulev__details-images-double'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
//                     id={`video-${index}-${idx}`}
//                     loop
//                     autoPlay
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout !== 'double' && (
//             <div className='ulev__details-images ' style={{padding: "4rem 4rem 4rem 4rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     ref={el => videoRefs.current[`video-${index}-${idx}`] = el}
//                     id={`video-${index}-${idx}`}
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video_pair' && (
//             <div className='ulev__details-video-pair sectiona__padding-vid'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-video-section'>
//                   <video
//                     ref={el => videoRefs.current[`video-pair-${index}-${idx}`] = el}
//                     id={`video-pair-${index}-${idx}`}
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     onClick={() => handlePlayPause(`video-pair-${index}-${idx}`)}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={`/work/${relatedProject.slug}`} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;


















// import React, { useState, useEffect } from'react';
// import { useParams, Link } from'react-router-dom';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './projectDetails.css';
// import LazyLoad from'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const ProjectDetails = () => {
//   const { slug } = useParams();
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         const projectsRef = collection(db, 'projects');
//         const q = query(projectsRef, where("title", "==", slug.replace(/-/g, '')));
//         const querySnapshot = await getDocs(q);
//         const projectDoc = querySnapshot.docs[0];
//         setProject({ id: projectDoc.id,...projectDoc.data() });
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProject();
//   }, [slug]);

//   const renderContent = (content) => {
//     if (typeof content ==='string') {
//       return content.split(',').map(item => item.trim());
//     }
//     return Array.isArray(content)? content : [content];
//   };

//   if (loading) return <div>Loading project details...</div>;
//   if (error) return <div>Error: {error}</div>;
//   if (!project) return <div>No project found</div>;

//   return (
//     <div className='ulev_details'>
//       <div className="ulev__details-title section__padding">
//         <div style={{display: 'flex', justifyContent:'space-between', alignItems: 'flex-start', width: '100%'}}>
//           <div>
//             <h1><span>{project.title || 'No Title'}</span> - <span>{project.location || 'No Location'}</span></h1>
//             <h2 style={{color: '#ffffff'}}>{project.subtitle || 'No Subtitle'}</h2>
//           </div>
//           <div className='ulev__details-description' style={{ textAlign: 'right' }}>
//             <p style={{color: '#8a8a8a', marginBottom: "auto", fontSize: '16px'}}>{project.description || 'No Description'}</p>
//           </div>
//         </div>
//       </div>

//       {project.coverMedia && (
//         <div className='ulev__details-images' style={{padding: "4rem 4rem 0rem 4rem"}}>
//           <div className="single-image-section">
//             {project.coverMedia.type === 'video'? (
//               <video
//                 autoPlay
//                 loop
//                 muted
//                 playsInline
//                 style={{ cursor: 'pointer' }}
//               >
//                 <source src={project.coverMedia.url} type="video/mp4" />
//                 Your browser does not support the video tag.
//               </video>
//             ) : (
//               <BlurhashImg src={project.coverMedia.url} placeholderColor="#888"/>
//             )}
//           </div>
//         </div>
//       )}

//       {project.sections && project.sections.length > 0 && project.sections.map((section, index) => (
//         <div key={index} className="ulev_morePD " id={`section-${index}`}>
//           {section.type === 'text' && (
//             <div className="ulev_morePD-contain sectiona__padding">
//               <p className='ulev_morePD-other'></p>
//               <div className='ulev_morePD-p'>
//                 <div 
//                   dangerouslySetInnerHTML={{ __html: section.content }} 
//                   className="ulev_morePD-content"
//                   style={{color: "#fff"}}
//                 />
//               </div>
//             </div>
//           )}
//           {section.type === 'image' && section.layout!== 'double' && (
//             <div className='ulev__details-images image__padding' style={{padding: "0rem 4.2rem 0rem 4.2rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'image_pair' && (
//             <div className='ulev__details-image-pair sectionass__padding'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-image-section'>
//                   <BlurhashImg src={url} placeholderColor="#888"/>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout === 'double' && (
//             <div className='ulev__details-images section__padding ulev__details-images-double'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video' && section.layout!== 'double' && (
//             <div className='ulev__details-images'style={{padding: "4rem 4rem 4rem 4rem"}}>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className="single-image-section">
//                   <video
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//           {section.type === 'video_pair' && (
//             <div className='ulev__details-video-pair sectiona__padding-vid'>
//               {renderContent(section.content).map((url, idx) => (
//                 <div key={idx} className='half-video-section'>
//                   <video
//                     autoPlay
//                     loop
//                     muted
//                     playsInline
//                     style={{ cursor: 'pointer' }}
//                   >
//                     <source src={url} type="video/mp4" />
//                     Your browser does not support the video tag.
//                   </video>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       {project.relatedProjects && project.relatedProjects.length > 0 && (
//         <div className="related-container section__padding">
//           <h1 className="related">Related Projects</h1>
//           <div className="related-projects-grid">
//             {project.relatedProjects.map((relatedProject, index) => (
//               <Link key={index} to={`/work/${relatedProject.title.replace(/ /g,'-').toLowerCase()}`} className="related-card">
//                 <div className="related-image-container">
//                   <LazyLoad>
//                     <img
//                       src={relatedProject.coverImage}
//                       alt={relatedProject.title}
//                       className="related-image"
//                     />
//                   </LazyLoad>
//                   <div className="overlay">
//                     <h2 className="related-title">{relatedProject.title}</h2>
//                     <p className="related-subtitle">{relatedProject.description || ''}</p>
//                     <p className="related-location">{relatedProject.location || ''}</p>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;