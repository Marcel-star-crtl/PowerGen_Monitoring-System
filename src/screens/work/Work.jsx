// // import React from 'react';
// // import './work.css';
// // import { Works } from '../../containers';

// // const Work = () => {
// //   return (
// //     <div>
// //       <Works />
// //     </div>
// //   );
// // }

// // export default Work;


// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import ReactPaginate from 'react-paginate';
// import './work.css';
// import { project0, project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15 } from './import';
// import LazyLoad from 'react-lazyload';

// const projectDetails = [
//   // {
//   //   id: 0,
//   //   title: 'Echolink Solutions',
//   //   description: 'Brand Identity',
//   //   location: 'Washington - USA',
//   // },
//   {
//     id: 1,
//     title: 'Ideal Farmers Yought Recognition Awards',
//     description: 'Brand Identity, website',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 2,
//     title: 'Apprey Public Relations',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Chicago - USA',
//   },
//   {
//     id: 3,
//     title: 'Silicon Mountain Conference 2023',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Cameroon - Africa',
//   },
  
//   {
//     id: 4,
//     title: 'Lewa',
//     description: 'Brand Identity, Design Implementation, Naming',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 5,
//     title: 'Electronic Data interchange Technology Institute',
//     description: 'Brand Identity - Brand Package',
//     location: 'Washington - USA',
//   },
//   {
//     id: 6,
//     title: 'Purpose - Africa',
//     description: 'Brand Identity, Brand Positioning, Market Research, Naming',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 7,
//     title: 'Alani - Africa',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 8,
//     title: 'Mayen Spices & Foods',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 9,
//     title: 'Ulevus Brand Book',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//   },
//   // {
//   //   id: 10,
//   //   title: 'Mayen Spices $ Foods',
//   //   description: 'Brand Identity - Brand Package',
//   //   location: 'Cameroon - Africa',
//   // },
//   {
//     id: 11,
//     title: 'African Rooted',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//   },
//   {
//     id: 12,
//     title: 'Son Technology',
//     description: 'Brand Identity - Brand Package',
//     location: 'USA',
//   },
//   {
//     id: 13,
//     title: 'House of Sigala',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 14,
//     title: 'Eagle Wings Spices',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//   },
//   {
//     id: 15,
//     title: 'RuSir',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//   },
// ];

// const Work = () => {
//   const projectsPerPage = 30;
//   const [currentPage, setCurrentPage] = useState(0);

//   const projects = [ project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15];

//   // Calculate the start index for the current page
//   const startIndex = currentPage * projectsPerPage;

//   // Calculate the end index for the current page
//   const endIndex = startIndex + projectsPerPage;

//   // Display the projects for the current page
//   const currentPageProjects = projects.slice(startIndex, endIndex);

//   const handlePageClick = (data) => {
//     setCurrentPage(data.selected);
//   };

//   return (
//     <div className="works-container section__padding">
//       {/* Featured Project */}
//       <Link to={`/project${projectDetails[currentPage]?.id}Details`} className="work-card">
//         <div className="featured-image">
//           <LazyLoad offset={100}>
//             <img src={project0} alt="Featured Image" />
//           </LazyLoad>
//           <div className="overlayp">
//             {/* Use the current page index to fetch project details */}
//             <h2>{projectDetails[currentPage]?.title}</h2>
//             <p>{projectDetails[currentPage]?.description}</p>
//             <p>{projectDetails[currentPage]?.location}</p>
//           </div>
//         </div>
//       </Link>

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//         <div className="work-cards">
//           {currentPageProjects.map((project, index) => (
//             <Link key={index} to={`/project${projectDetails[startIndex + index]?.id}Details`} className="work-card">
//               <div className="work-card">
//                 <LazyLoad offset={100}>
//                   <img src={project} alt={`Project ${index + 1}`} />
//                 </LazyLoad>
//                 <div className="overlayp">
//                   <h2>{projectDetails[startIndex + index]?.title}</h2>
//                   <p>{projectDetails[startIndex + index]?.description}</p>
//                   <p>{projectDetails[startIndex + index]?.location}</p>
//                 </div>
//               </div>
//             </Link>
//           ))}
//       </div>
//       {/* <ReactPaginate
//         previousLabel={'previous'}
//         nextLabel={'next'}
//         breakLabel={'...'}
//         pageCount={Math.ceil(projects.length / projectsPerPage)}
//         marginPagesDisplayed={2}
//         pageRangeDisplayed={5}
//         onPageChange={handlePageClick}
//         containerClassName={'pagination'}
//         subContainerClassName={'pages pagination'}
//         activeClassName={'active'}
//         pageClassName={'page-item'}
//         previousClassName={'page-item'}
//         nextClassName={'page-item'}
//         pageLinkClassName={'page-link'}
//         previousLinkClassName={'page-link'}
//         nextLinkClassName={'page-link'}
//         breakClassName={'page-item'}
//         breakLinkClassName={'page-link'}
//         disabledClassName={'disabled'}
//         style={{ justifyContent: 'flex-end' }}
//       /> */}
//     </div>
//   );
// };

// export default Work;




// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import ReactPaginate from 'react-paginate';
// import './work.css';
// import { project0, project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15, project16, project17 } from './import';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const projectDetails = [
//   {
//     id: 1,
//     title: 'Echolink Solutions',
//     description: 'Brand Identity, website',
//     location: 'USA',
//     slug: 'echolink-solutions',
//   },
//   {
//     id: 1,
//     title: 'Ideal Farmers Youth Recognition Awards',
//     description: 'Brand Identity',
//     location: 'Cameroon - Africa',
//     slug: 'ideal-farmers-yought-recognition-awards',
//   },
//   {
//     id: 2,
//     title: 'Apprey Public Relations',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Chicago - USA',
//     slug: 'apprey-public-relations-pr',
//   },
//   {
//     id: 3,
//     title: 'Silicon Mountain Conference 2023',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Cameroon - Africa',
//     slug: 'silicon-mountain-conference-2023',
//   },
  
//   {
//     id: 4,
//     title: 'Lewa',
//     description: 'Brand Identity, Design Implementation, Naming',
//     location: 'Cameroon - Africa',
//     slug: 'Lewa',
//   },
//   {
//     id: 5,
//     title: 'Electronic Data interchange Technology Institute',
//     description: 'Brand Identity - Brand Package',
//     location: 'Washington - USA',
//     slug: 'editi',
//   },
//   {
//     id: 6,
//     title: 'Purpose - Africa',
//     description: 'Brand Identity, Brand Positioning, Market Research, Naming',
//     location: 'Cameroon - Africa',
//     slug: 'purpose',
//   },
//   {
//     id: 7,
//     title: 'Alani - Africa',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'alani',
//   },
//   {
//     id: 8,
//     title: 'Mayen Spices & Foods',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'mayen-spices',
//   },
//   {
//     id: 9,
//     title: 'Ulevus Brand Book',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'ulevus-brand-book-version-1-0',
//   },
//   {
//     id: 11,
//     title: 'African Rooted',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//     slug: 'african-rooted',
//   },
//   {
//     id: 12,
//     title: 'Son Technology',
//     description: 'Brand Identity - Brand Package',
//     location: 'USA',
//     slug: 'sontech',
//   },
//   {
//     id: 13,
//     title: 'House of Sigala',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'house-of-sigala',
//   },
//   {
//     id: 14,
//     title: 'Eagle Wings Spices',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'eagle-wings',
//   },
//   {
//     id: 15,
//     title: 'RuSir',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//     slug: 'rumi-sir',
//   },
//   {
//     id: 16,
//     title: 'Annies Boutique',
//     description: 'Brand Identity, website',
//     location: 'USA',
//     slug: 'annies-boutique',
//   },
//   {
//     id: 17,
//     title: 'LGV Gas Systems',
//     description: 'Brand Identity, website',
//     location: 'Nigeria',
//     slug: 'lgv-gas-systems',
//   },
// ];

// const Work = () => {
//   const projectsPerPage = 30;
//   const [currentPage, setCurrentPage] = useState(0);

//   const projects = [project0, project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15, project16, project16];

//   const startIndex = currentPage * projectsPerPage;
//   const endIndex = Math.min(startIndex + projectsPerPage, projects.length - 1);
//   const currentPageProjects = projects.slice(startIndex, endIndex);

//   const handlePageClick = (data) => {
//     setCurrentPage(data.selected);
//   };

//   return (
//     <div className="works-container section__padding">
//       <Link to={`/${projectDetails[16]?.slug}`} className="work-card"> 
//         <div className="featured-image">
//           <BlurhashImg src={project17} placeholderColor="#888"/>
//           <div className="overlayp">
//             <h2>{projectDetails[16]?.title}</h2>
//             <p>{projectDetails[16]?.description}</p>
//             <p>{projectDetails[16]?.location}</p>
//           </div>
//         </div>
//       </Link>

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//       <div className="work-cards">
//         {currentPageProjects.map((project, index) => {
//           const projectIndex = startIndex + index; 
//           return (
//             <Link key={index} to={`/${projectDetails[projectIndex]?.slug}`} className="work-card">
//               <div className="work-card">
//                 <BlurhashImg src={project} alt={`Project ${index + 1}`} placeholderColor="#888"/>
//                 <div className="overlayp">
//                   <h2>{projectDetails[projectIndex]?.title}</h2>
//                   <p>{projectDetails[projectIndex]?.description}</p>
//                   <p>{projectDetails[projectIndex]?.location}</p>
//                 </div>
//               </div>
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Work;










// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import ReactPaginate from 'react-paginate';
// import './work.css';
// import { project0, project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15, project16, project17 } from './import';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const projectDetails = [
//   {
//     id: 16,
//     title: 'LGV Gas Systems',
//     description: 'Brand Identity, website',
//     location: 'Nigeria',
//     slug: 'lgv-gas-systems',
//   },
//   {
//     id: 0,
//     title: 'Annies Boutique',
//     description: 'Brand Identity, website',
//     location: 'USA',
//     slug: 'annies-boutique',
//   },
//   {
//     id: 1,
//     title: 'Echolink Solutions',
//     description: 'Brand Identity, website',
//     location: 'USA',
//     slug: 'echolink-solutions',
//   },
//   {
//     id: 2,
//     title: 'Ideal Farmers Youth Recognition Awards',
//     description: 'Brand Identity',
//     location: 'Cameroon - Africa',
//     slug: 'ideal-farmers-yought-recognition-awards',
//   },
//   {
//     id: 3,
//     title: 'Apprey Public Relations',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Chicago - USA',
//     slug: 'apprey-public-relations-pr',
//   },
//   {
//     id: 4,
//     title: 'Silicon Mountain Conference 2023',
//     description: 'Brand Identity, Design Implementation',
//     location: 'Cameroon - Africa',
//     slug: 'silicon-mountain-conference-2023',
//   },
  
//   {
//     id: 5,
//     title: 'Lewa',
//     description: 'Brand Identity, Design Implementation, Naming',
//     location: 'Cameroon - Africa',
//     slug: 'Lewa',
//   },
//   {
//     id: 6,
//     title: 'Electronic Data interchange Technology Institute',
//     description: 'Brand Identity - Brand Package',
//     location: 'Washington - USA',
//     slug: 'editi',
//   },
//   {
//     id: 7,
//     title: 'Purpose - Africa',
//     description: 'Brand Identity, Brand Positioning, Market Research, Naming',
//     location: 'Cameroon - Africa',
//     slug: 'purpose',
//   },
//   {
//     id: 8,
//     title: 'Alani - Africa',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'alani',
//   },
//   {
//     id: 9,
//     title: 'Mayen Spices & Foods',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'mayen-spices',
//   },
//   {
//     id: 10,
//     title: 'Ulevus Brand Book',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'ulevus-brand-book-version-1-0',
//   },
//   {
//     id: 11,
//     title: 'African Rooted',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//     slug: 'african-rooted',
//   },
//   {
//     id: 12,
//     title: 'Son Technology',
//     description: 'Brand Identity - Brand Package',
//     location: 'USA',
//     slug: 'sontech',
//   },
//   {
//     id: 13,
//     title: 'House of Sigala',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'house-of-sigala',
//   },
//   {
//     id: 14,
//     title: 'Eagle Wings Spices',
//     description: 'Brand Identity - Brand Package',
//     location: 'Cameroon - Africa',
//     slug: 'eagle-wings',
//   },
//   {
//     id: 15,
//     title: 'RuSir',
//     description: 'Brand Identity - Brand Package',
//     location: 'Canada - USA',
//     slug: 'rumi-sir',
//   }
  
// ];

// const Work = () => {
//   const projectsPerPage = 30;
//   const [currentPage, setCurrentPage] = useState(0);

//   const projects = [project0, project1, project2, project3, project4, project5, project6, project7, project8, project9, project11, project12, project13, project14, project15, project16, project17];

//   const startIndex = currentPage * projectsPerPage;
//   const endIndex = Math.min(startIndex + projectsPerPage, projects.length - 1);
//   const currentPageProjects = projects.slice(startIndex, endIndex);

//   const handlePageClick = (data) => {
//     setCurrentPage(data.selected);
//   };

//   return (
//     <div className="works-container section__padding">
//       <Link to={`/work/${projectDetails[0]?.slug}`} className="work-card"> 
//         <div className="featured-image">
//           <BlurhashImg src={project17} placeholderColor="#888"/>
//           <div className="overlayp">
//             <h2>{projectDetails[0]?.title}</h2>
//             <p>{projectDetails[0]?.description}</p>
//             <p>{projectDetails[0]?.location}</p>
//           </div>
//         </div>
//       </Link>

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//       <div className="work-cards">
//       {/* project1 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[1]?.slug}`} className="work-card">
//           <div className="featured-image">
//           <BlurhashImg src={project0} placeholderColor="#888"/>
//             <div className="overlayp">
//               <h2>{projectDetails[1]?.title}</h2>
//               <p>{projectDetails[1]?.description}</p>
//               <p>{projectDetails[1]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}
//       {/* project2 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 2]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project16} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[2]?.title}</h2>
//               <p>{projectDetails[2]?.description}</p>
//               <p>{projectDetails[2]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}
//       {/* project3 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 3]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project1} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[3]?.title}</h2>
//               <p>{projectDetails[3]?.description}</p>
//               <p>{projectDetails[3]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project4 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 4]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project2} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[4]?.title}</h2>
//               <p>{projectDetails[4]?.description}</p>
//               <p>{projectDetails[4]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project4 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 5]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project3} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[5]?.title}</h2>
//               <p>{projectDetails[5]?.description}</p>
//               <p>{projectDetails[5]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 6]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project4} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[6]?.title}</h2>
//               <p>{projectDetails[6]?.description}</p>
//               <p>{projectDetails[6]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 7]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project5} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[7]?.title}</h2>
//               <p>{projectDetails[7]?.description}</p>
//               <p>{projectDetails[7]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 8]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project6} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[8]?.title}</h2>
//               <p>{projectDetails[8]?.description}</p>
//               <p>{projectDetails[8]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}


//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 9]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project7} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[9]?.title}</h2>
//               <p>{projectDetails[9]?.description}</p>
//               <p>{projectDetails[9]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 10]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project8} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[10]?.title}</h2>
//               <p>{projectDetails[10]?.description}</p>
//               <p>{projectDetails[10]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 11]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project9} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[11]?.title}</h2>
//               <p>{projectDetails[11]?.description}</p>
//               <p>{projectDetails[11]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 12]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project11} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[12]?.title}</h2>
//               <p>{projectDetails[12]?.description}</p>
//               <p>{projectDetails[12]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 13]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project12} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[13]?.title}</h2>
//               <p>{projectDetails[13]?.description}</p>
//               <p>{projectDetails[13]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}
//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 14]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project13} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[14]?.title}</h2>
//               <p>{projectDetails[14]?.description}</p>
//               <p>{projectDetails[14]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 15]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project14} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[15]?.title}</h2>
//               <p>{projectDetails[15]?.description}</p>
//               <p>{projectDetails[15]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       {/* project5 */}
//       {currentPageProjects.length > 1 && (
//         <Link to={`/work/${projectDetails[startIndex + 16]?.slug}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={project15} placeholderColor="#888" />
//             <div className="overlayp">
//               <h2>{projectDetails[14]?.title}</h2>
//               <p>{projectDetails[14]?.description}</p>
//               <p>{projectDetails[14]?.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}
//       </div>
//     </div>
//   );
// };

// export default Work;









// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './work.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const Work = () => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const projectsCollection = collection(db, 'projects');
//         const snapshot = await getDocs(projectsCollection);
//         const fetchedProjects = snapshot.docs.map(doc => {
//           const data = doc.data();
//           console.log(`Project ${doc.id} data:`, data);
//           console.log(`Project ${doc.id} cover image:`, data.coverImage);
          
//           if (!data.coverImage) {
//             console.warn(`Project ${doc.id} is missing a cover image.`);
//           }
          
//           return { id: doc.id, ...data };
//         });
        
//         fetchedProjects.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        
//         console.log('Fetched projects:', fetchedProjects);
//         setProjects(fetchedProjects);
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//         setError("Failed to load projects. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   if (loading) {
//     return <div>Loading projects...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   const featuredProject = projects[0]; 

//   return (
//     <div className="works-container section__padding">
//       {featuredProject && (
//         <Link to={`/work/${featuredProject.id}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={featuredProject.coverImage} placeholderColor="#888"/>
//             <div className="overlayp">
//               <h2>{featuredProject.title}</h2>
//               <p>{featuredProject.description}</p>
//               {/* <p>{featuredProject.subtitle}</p> */}
//               <p>{featuredProject.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//       <div className="work-cards">
//         {projects.slice(1).map((project) => (
//           <Link key={project.id} to={`/work/${project.id}`} className="work-card">
//             <div className="featured-image">
//               {project.coverImage ? (
//                 <BlurhashImg 
//                   src={project.coverImage} 
//                   placeholderColor="#888"
//                   onError={(e) => {
//                     console.error('Error loading image:', project.coverImage);
//                     e.target.src = '/fallback-image.jpg'; 
//                   }}
//                 />
//               ) : (
//                 <div className="no-image">No Image Available</div>
//               )}
//               <div className="overlayp">
//                 <h2>{project.title || 'Untitled Project'}</h2>
//                 <p>{project.description || 'not specified'}</p>
//                 {/* <p>{project.subtitle || 'No description available'}</p> */}
//                 <p>{project.location || 'Location not specified'}</p>
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Work;








// import React, { useState, useEffect } from 'react';
// import { Link } from'react-router-dom';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './work.css';
// import LazyLoad from'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const Work = () => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const projectsCollection = collection(db, 'projects');
//         const snapshot = await getDocs(projectsCollection);
//         const fetchedProjects = snapshot.docs.map(doc => {
//           const data = doc.data();
//           console.log(`Project ${doc.id} data:`, data);
//           console.log(`Project ${doc.id} cover image:`, data.coverImage);

//           if (!data.coverImage) {
//             console.warn(`Project ${doc.id} is missing a cover image.`);
//           }

//           return { id: doc.id,...data };
//         });

//         // Sort projects by creation timestamp in descending order
//         fetchedProjects.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

//         console.log('Fetched projects:', fetchedProjects);
//         setProjects(fetchedProjects);
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//         setError("Failed to load projects. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const slugify = (text) => {
//     return text.toString().toLowerCase()
//      .replace(/\s+/g, '-')           // Replace spaces with -
//      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
//      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
//      .replace(/^-+/, '')             // Trim - from start of text
//      .replace(/-+$/, '');            // Trim - from end of text
//   };

//   if (loading) {
//     return <div>Loading projects...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   // Filter projects based on their visibility
//   const visibleProjects = projects.filter(project => project.isVisible);

//   // Get the featured project (first visible project)
//   const featuredProject = visibleProjects[0]; 

//   return (
//     <div className="works-container section__padding">
//       {featuredProject && (
//         <Link to={`/work/${slugify(featuredProject.title)}`} className="work-card">
//           <div className="featured-image">
//             <LazyLoad>
//               <img
//                 src={featuredProject.coverImage}
//                 alt={featuredProject.title}
//                 className="featured-image"
//               />
//             </LazyLoad>
//             <div className="overlayp">
//               <h2>{featuredProject.title}</h2>
//               <p>{featuredProject.description}</p>
//               <p>{featuredProject.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//       <div className="work-cards">
//         {visibleProjects.slice(1).map((project) => (
//           <Link key={project.id} to={`/work/${slugify(project.title)}`} className="work-card">
//             <div className="featured-image">
//               {project.coverImage? (
//                 <LazyLoad>
//                   <img
//                     src={project.coverImage}
//                     alt={project.title}
//                     className="featured-image"
//                   />
//                 </LazyLoad>
//               ) : (
//                 <div className="no-image">No Image Available</div>
//               )}
//               <div className="overlayp">
//                 <h2>{project.title || 'Untitled Project'}</h2>
//                 <p>{project.description || 'not specified'}</p>
//                 <p>{project.location || 'Location not specified'}</p>
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Work;












// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';
// import './work.css';
// import LazyLoad from 'react-lazyload';
// import BlurhashImg from '../../@/components/Image/BlurhashImg';

// const Work = () => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const projectsCollection = collection(db, 'projects');
//         const snapshot = await getDocs(projectsCollection);
//         const fetchedProjects = snapshot.docs.map(doc => {
//           const data = doc.data();
//           console.log(`Project ${doc.id} data:`, data);
//           console.log(`Project ${doc.id} cover image:`, data.coverImage);

//           if (!data.coverImage) {
//             console.warn(`Project ${doc.id} is missing a cover image.`);
//           }

//           if (!data.slug) {
//             console.warn(`Project ${doc.id} is missing a slug.`);
//           }

//           return { id: doc.id, ...data };
//         });

//         // Sort projects by creation timestamp in descending order
//         fetchedProjects.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

//         console.log('Fetched projects:', fetchedProjects);
//         setProjects(fetchedProjects);
//       } catch (error) {
//         console.error("Error fetching projects:", error);
//         setError("Failed to load projects. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   if (loading) {
//     return <div>Loading projects...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   // Filter projects based on their visibility
//   const visibleProjects = projects.filter(project => project.isVisible);

//   // Get the featured project (first visible project)
//   const featuredProject = visibleProjects[0]; 

//   return (
//     <div className="works-container section__padding">
//       {featuredProject && (
//         <Link to={`/work/${featuredProject.slug || featuredProject.id}`} className="work-card">
//           <div className="featured-image">
//             <BlurhashImg src={featuredProject.coverImage} placeholderColor="#888"/>
//             <div className="overlayp">
//               <h2>{featuredProject.title}</h2>
//               <p>{featuredProject.description}</p>
//               <p>{featuredProject.location}</p>
//             </div>
//           </div>
//         </Link>
//       )}

//       <h1>Projects</h1>
//       <p>We build brands that cannot be ignored.</p>

//       <div className="work-cards">
//         {visibleProjects.slice(1).map((project) => (
//           <Link key={project.id} to={`/work/${project.slug || project.id}`} className="work-card">
//             <div className="featured-image">
//               {project.coverImage ? (
//                 <BlurhashImg 
//                   src={project.coverImage} 
//                   placeholderColor="#888"
//                   onError={(e) => {
//                     console.error('Error loading image:', project.coverImage);
//                     e.target.src = '/fallback-image.jpg'; 
//                   }}
//                 />
//               ) : (
//                 <div className="no-image">No Image Available</div>
//               )}
//               <div className="overlayp">
//                 <h2>{project.title || 'Untitled Project'}</h2>
//                 <p>{project.description || 'not specified'}</p>
//                 <p>{project.location || 'Location not specified'}</p>
//               </div>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Work;






import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './work.css';
import LazyLoad from 'react-lazyload';
import BlurhashImg from '../../@/components/Image/BlurhashImg';

const Work = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, 'projects');
        const snapshot = await getDocs(projectsCollection);
        const fetchedProjects = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Project ${doc.id} data:`, data);
          console.log(`Project ${doc.id} cover image:`, data.coverImage);

          if (!data.coverImage) {
            console.warn(`Project ${doc.id} is missing a cover image.`);
          }

          if (!data.slug) {
            console.warn(`Project ${doc.id} is missing a slug.`);
          }

          return { id: doc.id, ...data };
        });

        fetchedProjects.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

        console.log('Fetched projects:', fetchedProjects);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const visibleProjects = projects.filter(project => project.isVisible);
  const featuredProject = visibleProjects[0];

  const getProjectLink = (project) => {
    return project.slug ? `/work/${project.slug}` : `/work/${project.id}`;
  };

  return (
    <div className="works-container section__padding">
      {featuredProject && (
        <Link to={getProjectLink(featuredProject)} className="work-card">
          <div className="featured-image">
            <BlurhashImg src={featuredProject.coverImage} placeholderColor="#888"/>
            <div className="overlayp">
              <h2>{featuredProject.title}</h2>
              <p>{featuredProject.description}</p>
              <p>{featuredProject.location}</p>
            </div>
          </div>
        </Link>
      )}

      <h1>Projects</h1>
      <p>We build brands that cannot be ignored.</p>

      <div className="work-cards">
        {visibleProjects.slice(1).map((project) => (
          <Link key={project.id} to={getProjectLink(project)} className="work-card">
            <div className="featured-image">
              {project.coverImage ? (
                <BlurhashImg 
                  src={project.coverImage} 
                  placeholderColor="#888"
                  onError={(e) => {
                    console.error('Error loading image:', project.coverImage);
                    e.target.src = '/fallback-image.jpg'; 
                  }}
                />
              ) : (
                <div className="no-image">No Image Available</div>
              )}
              <div className="overlayp">
                <h2>{project.title || 'Untitled Project'}</h2>
                <p>{project.description || 'not specified'}</p>
                <p>{project.location || 'Location not specified'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Work;