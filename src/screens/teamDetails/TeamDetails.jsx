// import React, { useState } from 'react';
// import { useParams } from 'react-router-dom';
// import './teamDetails.css';
// import { Article, Article2, Article3, Article4 } from '../../@/components';
// import "slick-carousel/slick/slick.css"; 
// import "slick-carousel/slick/slick-theme.css";
// import { team1, team2, team3, team4, team5, team6, team7, team8, team9 } from './imports';
// import { useMediaQuery } from 'react-responsive';

// const teamMembers = [
//   {
//     id: 1, 
//     slug: "Arnold",
//     photos: [team1], 
//     text: "Creative Director", 
//     title: "Arnold Sigala",
//     moreBio: "As an experienced designer with a passion for using design to enhance and uplift African communities and businesses, my journey has been marked by a relentless dedication to design thinking and an unwavering commitment to making positive impacts. With over a decade of experience in the design industry, I have dedicated my time to crafting unique and innovative designs that stand out. <br><br> As the Creative Director of Ulevus, a design and communication company, I lead not just a talented team but a family of visionary individuals who use design to solve complex problems. I envision Ulevus as a company synonymous with innovative solutions and forward-thinking design strategies that dare to reimagine the status quo. <br><br> My approach to design is rooted in empathy and a genuine desire to understand the people we serve. I believe that by taking the time to listen to the needs and aspirations of clients, solutions that drive meaningful change can be created. Hence, my approach to every project is with creativity, passion, and a relentless pursuit of excellence. <br><br> When I am not working on a project, you will likely find me volunteering and offering my skills to various causes, embracing the incredible potential of design as a force for social good. I enjoy reading books, constantly absorbing new ideas and insights, and applying the knowledge gained to shaping the world one project at a time. In essence, I see myself as a catalyst for positive and beautiful change."
//   },
//   {
//     id: 2, 
//     slug: "Ayo",
//     photos: [team2], 
//     text: "Manager of Operations", 
//     title: "Ayo Lasisi",
//     moreBio: "What gives me joy is the satisfaction experienced by both the Ulevus team and the Client. As the operations manager at Ulevus, I am invested in creating systems that operate smoothly, ensuring exceptional experience for everyone involved. It is about building an operational framework that correlates with the outstanding designs our team produces, captivating our customers and followers alike. This role gives me the unique privilege of connecting with each team member and engaging directly with our clients, solving challenges even before they arise. <br><br> My journey into the world of design and art started in my childhood, in the days I spent in my grandmother’s African Art shop. There, watching artisans shaping breathtaking African art, from statues to decorative calabashes, and strategically placing them on the shelves for customers to admire, fall in love with, and purchase. I watched people from diverse backgrounds and countries around the globe walk into her shop, admiring the work of art. There, at the African Art shop, I found my initial love for design. <br><br> 'Excellence Wins' by Horst Schulze stands out. This book didn't just expand my understanding of business operations; it inspired me to think innovatively, elevating Ulevus' business operations to new heights. With Ulevus primarily serving businesses, my role and skills become instrumental in the success of our clients’ projects and brand strategy, adding a layer of satisfaction to the work I love."
//   },
//   {
//     id: 3, 
//     slug: "Chinelo",
//     photos: [team3], 
//     text: "Graphic Designer", 
//     title: "Ojiaku Chinelo",
//     moreBio: "Graphic design, for me, transcends aesthetics. It's a powerful tool for clear communication, a philosophy that guides my daily approach. But my love for it deepened after I learned to effectively explain my creative process. This sparked a love for research, and it also instilled a meticulous approach that emphasizes exploration and knowledge. <br><br> Much more, I enjoy translating the vivid images in my mind into tangible, visually stunning creations. Witnessing my visions transform into captivating visuals is pure joy and fuels my passion every day. <br><br> So for every project, I am driven by the idea that thoughtful and Intentional design can deliver messages with impact. But, when I'm not designing, you’ll likely find me seeing movies with mind-bending plot twists. Just like a captivating movie, I strive for my designs to leave a lasting impression, one that sparks conversation and drives action."
//   },
//   {
//     id: 4,
//     slug: "Rebecca", 
//     photos: [team4], 
//     text: "Project Manager",  
//     title: "Ayuk Rebecca",
//     moreBio: "My passion for design has always fueled a desire to see creative ideas blossom into impactful experiences. That's what drew me to Design Project Management – the chance to collaborate with talented designers, clients, and teams to bring those ideas to life. <br><br> My leadership style reflects this collaborative spirit. I believe in a hybrid approach, finding the sweet spot between structure and flexibility to meet each project's unique needs. And when challenges arise, I approach them head-on using a structured problem-solving method. <br><br> This year, reading Robin Sharma's 'A Leader Who Had No Title' ignited a new spark in me. It's a reminder that leadership isn't about titles, but about unlocking potential. It resonates perfectly with my approach to project management, empowering everyone involved to bring their best selves to the table."
//   },
//   {
//     id: 5, 
//     slug: "Adewunmi",
//     photos: [team5], 
//     text: "Communication Strategist", 
//     title: "Adewunmi Adeya",
//     moreBio: "Discovering design's transformative power and its role at the genesis of innovation ignited my passion for it. Now as a Communication Strategist, I guide others to see this power. Working with design teams, I craft compelling stories and narratives, targeted messages, and strategic communication plans. My expertise in content creation and brand storytelling amplifies design initiatives and boosts brand visibility. <br><br> But I can't take credit for it all. Growing up, my parents, especially my dad instilled in me a love for books and critical thinking. <br><br> Their influence, alongside exposure to thought leaders like Simon Sinek and books such as 'Made to Stick' by Chip Heath and Dan Heath, shaped my approach to communication strategy. Drawing inspiration from this, I aim to craft clear, engaging content that resonates with audiences on an emotional level. When not working, I’m singing my heart out. My mirrors knows my routine and now you do."
//   },
//   {
//     id: 6, 
//     slug: "Marcel",
//     photos: [team6], 
//     text: "Full-Stack", 
//     title: "Marcel Yiosimbom",
//     moreBio: "The transformation of a small business website from outdated to modern and user-friendly became a defining moment in my career. Witnessing the impact of merging design and code to create a stunning, user-friendly platform ignited a passion for web development that burns brightly to this day. Since then, my greatest joy lies in translating abstract ideas into interactive experiences that captivate users. <br><br> However, a beautiful website is just one piece of the puzzle. My philosophy emphasizes a seamless blend of aesthetics and functionality. Websites should not only be visually appealing, but also perform flawlessly and cater to user needs. <br><br> To achieve this balance, I collaborate closely with designers. I weave technical solutions seamlessly into the design fabric, ensuring a smooth and impactful user journey. This philosophy of prioritizing beauty and functionality is a cornerstone of every project I undertake."
//   }
// ];


// const TeamDetails = () => {
//   const { memberId } = useParams();
//   const selectedMember = teamMembers.find(member => member.id === parseInt(memberId, 10));

//   const isDesktop = useMediaQuery({ minWidth: 769 }); 
//   const isNotDesktop = useMediaQuery({ maxWidth: 768 }); 

//   if (!selectedMember) {
//     return <p>Team member not found.</p>;
//   }

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     initialSlide: 0,
//     variableWidth: false, 
//     centerMode: false, 
//     centerPadding: '0', 
//     responsive: [
//       {
//         breakpoint: 1024,
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1,
//           infinite: true,
//           dots: true
//         }
//       },
//       {
//         breakpoint: 1200,
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1,
//           variableWidth: false,
//           centerMode: true,
//           centerPadding: '10%',
//           infinite: true,
//         }
//       }
//     ]
//   };

//   return (
//     <div className="teamDetails" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <div className="ulev__tdetails section__padding">
//         <div className='ulev__tdetails-container'>
//           <div className='ulev__tdetails-container_groupA'>
//             <Article
//               photos={selectedMember.photos}
//               name={selectedMember.name}
//               address={selectedMember.address}
//               title={selectedMember.title}
//               text={selectedMember.text}
//               moreBio={isNotDesktop ? selectedMember.moreBio : undefined}
//               sliderSettings={sliderSettings}
//             />
//           </div>
//           {isDesktop ? (
//             <div className='ulev__tdetails-container_groupB'>
//               <h1 style={{color:"#ffffff", fontSize:"35px", textAlign: "right"}}></h1>
//               <Article4 
//                 moreBio={<span dangerouslySetInnerHTML={{ __html: selectedMember.moreBio }} />}
//               />
//             </div>
//           ) : (
//             <div className='ulev__tdetails-container_groupB'>
//               <h1 className='bio'></h1>
//               <Article4 
//                 moreBio={<span dangerouslySetInnerHTML={{ __html: selectedMember.moreBio }} />}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default TeamDetails;








import React, { useState, useEffect } from'react';
import { useParams } from'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Article, Article2, Article3, Article4 } from '../../@/components';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { useMediaQuery } from'react-responsive';
import './teamDetails.css';

const TeamDetails = () => {
  const { slug } = useParams();
  const [teamMember, setTeamMember] = useState(null);

  const isDesktop = useMediaQuery({ minWidth: 769 }); 
  const isNotDesktop = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchTeamMember = async () => {
      const teamMemberRef = collection(db, 'team-members');
      const q = query(teamMemberRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        setTeamMember(querySnapshot.docs[0].data());
      }
    };
    fetchTeamMember();
  }, [slug]);

  if (!teamMember) {
    return <p>Team member not found.</p>;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
    variableWidth: false, 
    centerMode: false, 
    centerPadding: '0', 
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          variableWidth: false,
          centerMode: true,
          centerPadding: '10%',
          infinite: true,
        }
      }
    ]
  };

  return (
    <div className="teamDetails" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="ulev__tdetails section__padding">
        <div className='ulev__tdetails-container'>
          <div className='ulev__tdetails-container_groupA'>
            <Article
              photos={teamMember.photos}
              name={teamMember.name}
              title={teamMember.title}
              text={teamMember.position}
              moreBio={isNotDesktop? teamMember.morebio : undefined}
              sliderSettings={sliderSettings}
            />
          </div>
          {isDesktop? (
            <div className='ulev__tdetails-container_groupB'>
              <h1 style={{color:"#ffffff", fontSize:"35px", textAlign: "right"}}></h1>
              <Article4 
                moreBio={<span dangerouslySetInnerHTML={{ __html: teamMember.moreBio }} />}
              />
            </div>
          ) : (
            <div className='ulev__tdetails-container_groupB'>
              <h1 className='bio'></h1>
              <Article4 
                moreBio={<span dangerouslySetInnerHTML={{ __html: teamMember.moreBio }} />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamDetails;