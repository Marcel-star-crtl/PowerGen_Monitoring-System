// import React from 'react'
// import { Link } from 'react-router-dom'
// import './team.css'
// import { Article2 } from '../../@/components'
// import { team1, team2, team3, team4, team5, team6, team7, team8, team9 } from './imports'

// const Team = () => {
//   const teamMembers = [
//     { id: 1, photos: [team1], name: "Arnold Sigala", address: "Creative Director", slug: "Arnold"},
//     { id: 2, photos: [team2], name: "Ayo Lasisi", address: "Manager of Operations", slug: "Ayo"},
//     { id: 3, photos: [team3], name: "Ojiaku Chinelo", address: "Graphic Designer", slug: "Rebecca"},
//     { id: 4, photos: [team4], name: "Ayuk Rebecca", address: "Project Manager", slug:  "Rebecca"},
//     { id: 5, photos: [team5], name: "Adewunmi Adeya", address: "Communication Strategist", slug: "Adewumni"},
//     { id: 6, photos: [team6], name: "Marcel Yiosimbom", address: "Full-Stack", slug: "Marcel"}
//   ];

//   return (
//     <div className="ulev__team section__padding">
//       <div className='ulev__team-head'>
//         <h1 className='team__intro'> Our Team </h1>
//         <p>Our team comprises creative and driven individuals deeply attuned to the intricacies of African and global enterprises. We are devoted to enhancing the global representation of African businesses through exceptional designs, branding, and a strong digital presence, translating entrepreneurs' ideas into visual reality and boosting their profit margin.</p>
//       </div>
//       <div className='ulev__team-container'>
//         <div className='ulev__team-container_group'>
//           {teamMembers.map((member) => (
//             <Link key={member.id} to={`/team/${member.id}`}>
//               <Article2 photos={member.photos} name={member.name} address={member.address} showDetailsInfo={false} />
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Team













// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import './team.css';
// import { Article2 } from '../../@/components';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase'; 

// const Team = () => {
//   const [teamMembers, setTeamMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const teamMembersCollection = collection(db, 'team-members');
//         const teamMembersSnapshot = await getDocs(teamMembersCollection);
//         const teamMembersList = teamMembersSnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setTeamMembers(teamMembersList);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching team members:", err);
//         setError("Failed to load team members.");
//         setLoading(false);
//       }
//     };

//     fetchTeamMembers();
//   }, []);

//   if (loading) return <p>Loading team members...</p>;
//   if (error) return <p>{error}</p>;

//   return (
//     <div className="ulev__team section__padding">
//       <div className='ulev__team-head'>
//         <h1 className='team__intro'> Our Team </h1>
//         <p>Our team comprises creative and driven individuals deeply attuned to the intricacies of African and global enterprises. We are devoted to enhancing the global representation of African businesses through exceptional designs, branding, and a strong digital presence, translating entrepreneurs' ideas into visual reality and boosting their profit margin.</p>
//       </div>
//       <div className='ulev__team-container'>
//         <div className='ulev__team-container_group'>
//           {teamMembers.map((member) => (
//             <Link key={member.id} to={`/team/${member.id}`}>
//               <Article2 photos={[member.profileImage]} name={member.name} address={member.position} showDetailsInfo={false} />
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Team;





// import React, { useEffect, useState } from'react';
// import { Link } from'react-router-dom';
// import './team.css';
// import { Article2 } from '../../@/components';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase';

// const Team = () => {
//   const [teamMembers, setTeamMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const teamMembersCollection = collection(db, 'team-members');
//         const teamMembersSnapshot = await getDocs(teamMembersCollection);
//         const teamMembersList = teamMembersSnapshot.docs.map(doc => ({
//           id: doc.id,
//          ...doc.data()
//         }));
//         setTeamMembers(teamMembersList);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching team members:", err);
//         setError("Failed to load team members.");
//         setLoading(false);
//       }
//     };

//     fetchTeamMembers();
//   }, []);

//   if (loading) return <p>Loading team members...</p>;
//   if (error) return <p>{error}</p>;

//   return (
//     <div className="ulev__team section__padding">
//       <div className='ulev__team-head'>
//         <h1 className='team__intro'> Our Team </h1>
//         <p>Our team comprises creative and driven individuals deeply attuned to the intricacies of African and global enterprises. We are devoted to enhancing the global representation of African businesses through exceptional designs, branding, and a strong digital presence, translating their vision into reality and boosting their profit margin.</p>
//       </div>
//       <div className='ulev__team-container'>
//         <div className='ulev__team-container_group'>
//           {teamMembers.map((member) => (
//             <Article2 key={member.id} photos={[member.profileImage]} name={member.name} address={member.position} id={member.id} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Team;






import React, { useEffect, useState } from'react';
import { Link } from'react-router-dom';
import './team.css';
import { Article2 } from '../../@/components';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const teamMembersCollection = collection(db, 'team-members');
        const teamMembersSnapshot = await getDocs(teamMembersCollection);
        const teamMembersList = teamMembersSnapshot.docs.map(doc => ({
          id: doc.id,
         ...doc.data()
        }));
        setTeamMembers(teamMembersList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching team members:", err);
        setError("Failed to load team members.");
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) return <p>Loading team members...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="ulev__team section__padding">
      <div className='ulev__team-head'>
        <h1 className='team__intro'> Our Team </h1>
        <p>Our team comprises creative and driven individuals deeply attuned to the intricacies of African and global enterprises. We are devoted to enhancing the global representation of African businesses through exceptional designs, branding, and a strong digital presence, translating their vision into reality and boosting their profit margin.</p>
      </div>
      <div className='ulev__team-container'>
        <div className='ulev__team-container_group'>
          {teamMembers.map((member) => (
            <Article2 key={member.id} photos={[member.profileImage]} name={member.name} address={member.position} slug={member.slug} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;