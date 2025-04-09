import React, { useState, useEffect } from 'react';
import Masonry from 'react-layout-masonry';
import './post.css';
import Modale from '../../../containers/feed/Feed';
import Modal from '../../../@/components/modal/Modal';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import BlurhashImg from '../../../@/components/Image/BlurhashImg';
import DOMPurify from 'dompurify';

const Post = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [posts, setPosts] = useState([]);
  const [categories] = useState([
    { id: 1, name: "Articles" },
    { id: 2, name: "Events" },
    { id: 3, name: "News" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('Articles');
  const [modalPost, setModalPost] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsCollection = collection(db, 'news'); 
      const snapshot = await getDocs(postsCollection);
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort posts by creation timestamp in descending order
      fetchedPosts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      
      setPosts(fetchedPosts);
    };
    fetchPosts();
  }, []);

  const handleReadMore = (index) => {
    const clickedPost = filterPosts()[index];
    const postWithImage = { ...clickedPost, image: clickedPost.image };
    setModalPost(postWithImage);
  };

  const openModal = (image) => {
    setModalImage(image);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('en-GB', options);
  };

  const filterPosts = () => {
    if (!posts || posts.length === 0) {
      return [];
    }

    let filteredPosts = posts.filter(post => post.isPublished);

    if (selectedCategory === 'Articles') {
      return filteredPosts;
    }

    return filteredPosts.filter(post => post.category === selectedCategory);
  };

  const createMarkup = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  return (
    <>
      <div className="post-grid section__padding">
        <div className="category-buttons">
          {categories.map((category) => (
            <button
              key={category.id}
              className={selectedCategory === category.name ? 'active' : ''}
              onClick={() => handleCategoryChange(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={16} columnProps={{ className: 'post-container' }}>
          {filterPosts().map((post, index) => (
            <div key={post.id} style={{ marginBottom: "50px" }}>
              <BlurhashImg
                src={post.coverImage}
                alt="Post Featured Image"
                className="responsive blur_load"
                id={`clickableImage${post.id}`}
                loading="lazy" placeholderColor="#888" />
              <p style={{ color: "#888" }}>{formatDate(post.createdAt?.toDate())}</p>
              <h1>{post.title}</h1>
              <div style={{ color: '#888' }} className="content-container" dangerouslySetInnerHTML={createMarkup(post.content.length > 180 ? post.content.slice(0, 180) + '...' : post.content)}></div>
              <button
                onClick={() => handleReadMore(index)}
                style={{ marginTop: '18px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px", fontFamily: "Syne" }}
              >
                Read More
              </button>
            </div>
          ))}
        </Masonry>
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} image={modalImage} />
        {modalPost && <Modale post={modalPost} onClose={() => setModalPost(null)} />}
      </div>
    </>
  );
};

export default Post;











// import React, { useState, useEffect } from 'react';
// import Masonry from 'react-layout-masonry';
// import './post.css';
// import Modal from '../../../@/components/modal/Modal'; 
// import Modale from '../../../containers/feed/Feed'; 
// import { getDocs, collection, query, orderBy } from 'firebase/firestore';
// import { db } from '../../../firebase';
// import BlurhashImg from '../../../@/components/Image/BlurhashImg';

// const Post = () => {
//   const [modalIsOpen, setModalIsOpen] = useState(false);
//   const [postModalIsOpen, setPostModalIsOpen] = useState(false); 
//   const [modalImage, setModalImage] = useState('');
//   const [posts, setPosts] = useState([]);
//   const [categories] = useState([
//     { id: 1, name: "Articles" },
//     { id: 2, name: "Events" },
//     { id: 3, name: "News" },
//   ]);
//   const [selectedCategory, setSelectedCategory] = useState('Articles');
//   const [modalPost, setModalPost] = useState(null);

//   useEffect(() => {
//     const fetchPosts = async () => {
//       const postsCollection = collection(db, 'news');
//       const postsQuery = query(postsCollection, orderBy('createdAt', 'desc')); // Order by createdAt descending
//       const snapshot = await getDocs(postsQuery);
//       const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//       setPosts(fetchedPosts);
//     };
//     fetchPosts();
//   }, []);

//   const handleReadMore = (index) => {
//     const clickedPost = filterPosts()[index];
//     setModalPost(clickedPost);
//     setPostModalIsOpen(true); // Open post modal
//   };

//   const openModal = (image) => {
//     setModalImage(image);
//     setModalIsOpen(true);
//   };

//   const closeModal = () => {
//     setModalIsOpen(false);
//     setModalImage('');
//   };

//   const closePostModal = () => {
//     setPostModalIsOpen(false);
//     setModalPost(null);
//   };

//   const handleCategoryChange = (value) => {
//     setSelectedCategory(value);
//   };

//   const filterPosts = () => {
//     if (!posts || posts.length === 0) {
//       return [];
//     }

//     if (selectedCategory === 'Articles') {
//       return posts;
//     }

//     return posts.filter(post => post.category === selectedCategory);
//   };

//   const formatDate = (createdAt) => {
//     const dateObj = new Date(createdAt.seconds * 1000);
//     const day = dateObj.getDate();
//     const month = dateObj.toLocaleString('default', { month: 'long' });
//     const year = dateObj.getFullYear();

//     // Function to add ordinal suffix to the day
//     const getOrdinal = (n) => {
//       const s = ["th", "st", "nd", "rd"];
//       const v = n % 100;
//       return n + (s[(v - 20) % 10] || s[v] || s[0]);
//     };

//     const formattedDate = `${getOrdinal(day)} ${month} ${year}`;
//     return formattedDate;
//   };

//   const createMarkup = (html) => {
//     return { __html: html };
//   };

//   return (
//     <>
//       <div className="post-grid section__padding">
//         <div className="category-buttons">
//           {categories.map((category) => (
//             <button
//               key={category.id}
//               className={selectedCategory === category.name ? 'active' : ''}
//               onClick={() => handleCategoryChange(category.name)}
//             >
//               {category.name}
//             </button>
//           ))}
//         </div>
//         <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={16} columnProps={{ className: 'post-container' }}>
//           {filterPosts().map((post, index) => (
//             <div key={post.id} style={{ marginBottom: "50px" }}>
//               <BlurhashImg
//                 src={post.coverImage}
//                 alt="Post Featured Image"
//                 className="responsive blur_load"
//                 id={`clickableImage${post.id}`}
//                 loading="lazy" placeholderColor="#888" />
//               <p style={{ color: "#888" }}>{formatDate(post.createdAt)}</p>
//               <h1>{post.title}</h1>
//               <div 
//                 style={{ color: '#888' }} 
//                 className="content-container"
//                 dangerouslySetInnerHTML={createMarkup(post.content.length > 180 ? post.content.slice(0, 180) + '...' : post.content)}
//               ></div>
//               <button
//                 onClick={() => handleReadMore(index)}
//                 style={{ marginTop: '18px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px", fontFamily: "Syne" }}
//               >
//                 Read More
//               </button>
//             </div>
//           ))}
//         </Masonry>
//         <Modal isOpen={modalIsOpen} onRequestClose={closeModal} image={modalImage} />
//         {postModalIsOpen && modalPost && <Modale post={modalPost} onClose={closePostModal} />}
//       </div>
//     </>
//   );
// };

// export default Post;

















// import React, { useState, useEffect } from 'react';
// import Masonry from 'react-layout-masonry';
// import './post.css';
// import Modale from '../../../containers/feed/Feed';
// import Modal from '../../../@/components/modal/Modal';
// import { excerpt, excerpt1 } from './excerpt';
// import BlurhashImg from '../../../@/components/Image/BlurhashImg';
// import Chinelo from "../../../main_assets/Chineloo.avif"


// const Post = () => {
//   const [modalIsOpen, setModalIsOpen] = useState(false);
//   const [modalImage, setModalImage] = useState('');
  
//   const [posts, setPosts] = useState([
//     {
//       "id": 15,
//       "title": "The Day Design Became Inclusive: Bil Elton’s Journey As An Advocate",
//       excerpt: `They say there are two most important moments in a man's life: the day he's born and the day he discovers his purpose. While this is true, there are also other pivotal moments that spark a shift, a realization that alters the course of one's path. <br/> For Bil Elton, a UI/UX Designer at Iknite Studio, this transformative moment arrived just seven months ago. Attending the TegCampus International Hackathon by Identic Foundation, Malabo 2023 in Equatorial Guinea, Bil's initial focus was on creating an impactful design for a fintech company. <br/><br/> However, the event organizers had a different plan for him. <br/> The organizers challenged participants to build solutions for people with disabilities. To achieve this, Bil interviewed a visually impaired programmer, a conversation that would forever change his design perspective. <br/> "I had to sit down with him and really understand how he navigates his daily life," Bil recounts. "During our conversation, it struck me—we, as designers, have been neglecting a significant portion of the population. That's when the seed of inclusive design was planted in my mind." <br/><br/> Bil's newfound passion propelled him into action. Returning to Cameroon, he was struck by the lack of inclusive design principles in the local design scene. What he once considered "inclusive" design now felt woefully inadequate. He couldn't just stand by – it was time to take action. <br/><br/> <b style="color: #888; font-size: 18px;">Beyond Accessibility:</b> Designing Products that Empower Users with Disabilities <br/> Bil knew simply raising awareness wasn't enough. He wanted to equip his fellow designers with the knowledge to create products that went beyond basic accessibility. This realization became the foundation for his presentation at the design meetup in April: "Beyond Accessibility: Designing Products that Empower Users with Disabilities." <br/><br/> <b style="color: #888; font-size: 18px;">Understanding the Journey</b> <br/> Bil began by introducing the concept of the "Arc of Disability," a framework that acknowledges the path people with disabilities navigate throughout their lives. This journey encompasses self-discovery, acceptance, securing support, empowerment, and advocating for rights. Bil emphasized the importance of designing with empathy, considering the different stages a user might be in and how design can support them. <br/><br/> <b style="color: #888; font-size: 18px;">A Spectrum of Needs</b> <br/> Next, Bil addressed the "Spectrum of Disabilities." He highlighted the vast diversity within the disability community, encompassing physical, sensory, cognitive, developmental, and mental health conditions. <br/> This spectrum reminds us that a one-size-fits-all approach won't work. Every person's needs and experiences are unique. <br/><br/> <b style="color: #888; font-size: 18px;">Imposed Barriers</b> <br/> Bil challenged the traditional view of disability by introducing the concept of "Imposed Disability." He argued that disability isn't solely about a person's physical or mental impairments. Often, it's the societal barriers that prevent them from fully participating in life. By recognizing these barriers and designing to dismantle them, we can create a more inclusive world. <br/><br/> <b style="color: #888; font-size: 18px;">Temporary vs. Permanent</b> <br/> Bil also differentiated between "Temporary" and "Permanent" disabilities. Temporary disabilities, like a broken bone or illness, may require short-term design solutions. <br> Permanent disabilities, such as blindness or paralysis, demand more long-term considerations.  Understanding these distinctions is crucial for creating adaptable and inclusive products. <br/><br/> <b style="color: #888; font-size: 18px;">Accessibility vs. Inclusive Design</b> <br/> Bil clarified the relationship between "Accessibility" and "Inclusive Design." Accessibility, he explained, is likened to building a ramp – it ensures a specific group, people with disabilities, can access something. It follows established guidelines, like adding subtitles to videos or using good color contrast on websites. <br/><br/> Inclusive Design, on the other hand, is like building a wide sidewalk. It considers everyone's needs from the outset. It caters to a broader range of users, including those with disabilities, slow internet connections, those using mobile phones, or even someone in a noisy environment. <br/> •  Accessibility is the destination (everyone can use it). <br/> •  Inclusive Design is the journey (considers everyone from the beginning) <br/><br/> <b style="color: #888; font-size: 18px;">Building an Inclusive Future</b> <br/> Bil then outlined a roadmap for achieving Inclusive Design: <br/> •  <b style="color: #888; font-size: 18px;">Team Approach:</b> He stressed the importance of integrating accessibility considerations from the very beginning of the design process, not as an afterthought. This is akin to building a ramp during construction, rather than adding it later. <br/> •  <b style="color: #888; font-size: 18px;">Brainstorming:</b> Bil recommended collaborative brainstorming sessions with the entire team. The goal is to create a comprehensive picture of potential users – their strengths, limitations, likes, dislikes, and usage contexts. This builds empathy and ensures everyone's needs are considered. <br/> •  <b style="color: #888; font-size: 18px;">Selling the Design:</b> After generating inclusive design ideas, Bil underscored the importance of convincing stakeholders. He advised focusing on the benefits: a larger user base, cost-effectiveness, and a more streamlined development process for the team. <br/><br/> <b style="color: #888; font-size: 18px;">Now It’s Your Turn</b> <br/> Imagine a world where everyone can use the things we create. No one left out! That's the power of inclusive design. By working together, we can design products that anyone can use, no matter what. <br/> This isn't just a small change, it's a big step towards a world that celebrates everyone's unique abilities. Let's make sure everyone has the chance to shine! <br/><br/> Bil concluded, and as designers left the meetup that night, they carried Bil's words with them, forever changed by the power of inclusive design.`,
//       "date": "13th May 2024",
//       "postImage": "https://i.postimg.cc/tyqSdMrH/Bill-2.avif",
//       "categories": [0]
//     },
//     {
//       "id": 14,
//       "title": "From Design Intern To Lead: Chinelo Ojiaku's Journey as a Designer",
//       excerpt: `No one forgets their first; their first job, first paycheck, or first leadership role. For Chinelo Ojiaku, it's her first lead project as a designer at Ulevus. <br/><br/> This pivotal moment marks a significant milestone in her design journey. To capture this experience and celebrate her success, Adewunmi Adeya, Ulevus Communications Strategist, sat down with Chinelo to get an inside look at her first project as a lead designer. <br/><br/> <b style="color: #888; font-size: 18px;">Meet Chinelo Ojiaku</b> <br/> Chinelo's passion for design is clear from the start. "Hi, my name is Chinelo Ojiaku," she beams, “and I chose to be a designer because of my passion for creativity and problem-solving. Designs allow me to blend artistry with functionality to make meaningful impacts." <br/> This hunger for innovation fueled her decision to join Ulevus as an intern in August 2023. But Ulevus wasn't just a workplace; it was a breeding ground for growth and the raising of leaders. Thus, after completing her internship, she stayed back. <br/> "I chose to stay back because of the inspiring work culture, opportunities for growth, and the chance to contribute meaningfully to innovative projects," Chinelo explains. <br/><br/> And contribute, she did. <br/><br/> Less than a year after joining the company, Chinelo was soon offered the opportunity to lead Annie’s Boutique and Costume Jewelry’s project. <br/><br/> <b style="color: #888; font-size: 18px;">Leading with a Blend of Excitement and Responsibility</b> <br/> The news of leading a project was met with mixed emotions for Chinelo. "There was excitement and responsibility," she recalls. It was a chance to showcase her skills and guide the team towards success. This leadership role wasn't entirely unexpected, though. Chinelo viewed it as a natural progression in her career and an exciting challenge she was eager to embrace. <br/><br/> <b style="color: #888; font-size: 18px;">Collaboration and Clear Communication: Key To Success</b> <br/> To ensure the project aligned with Annie's Boutique's goals, Chinelo prioritized clear communication and collaboration. She conducted in-depth client interviews, gathered feedback, and worked closely with them to define project objectives and expectations. <br/> This focus on understanding client needs helped Chinelo in delivering optimal value. <br/> One of Chinelo's proudest achievements was a specific design element that "exceeded client expectations." <br/> However, the journey wasn't without hurdles. Unexpected challenges, like scheduling difficulties with the client and getting the perfect imagery, arose. <br/> Regardless, Chinelo's leadership shone through as she emphasized "effective communication, adaptability, and teamwork" to overcome these obstacles. <br/><br/> <b style="color: #888; font-size: 18px;">Lessons Learned And A Broader Perspective</b><br/> Looking back, Chinelo emphasizes the importance of these same qualities - clear communication, collaboration, adaptability, and remaining client-focused - for success in a lead designer role. <br/> Leading this project also broadened her design perspective. "It exposed me to diverse challenges and solutions," she says. She highlights the importance of user-centric design and staying agile in a constantly evolving environment. <br/><br/> <b style="color: #888; font-size: 18px;">Advice for Aspiring Design Leaders</b> <br/> For those stepping into a lead designer role, Chinelo offers valuable advice: "Embrace challenges, stay organized, communicate effectively, and continuously seek opportunities for growth and learning." <br/><br/> <b style="color: #888; font-size: 18px;"> Teamwork Makes the Dream Work </b> <br> Chinelo's success wasn't achieved alone. She acknowledges the crucial role her colleagues played. "Their expertise, collaboration, and encouragement significantly contributed to achieving our goals," she says. <br/> This collaborative spirit is a hallmark of Ulevus' work culture and a key ingredient in fostering the growth of talented designers like Chinelo Ojiaku.`,
//       "date": "26 April 2024",
//       "postImage": "https://dl.dropboxusercontent.com/scl/fi/u1pubrkiutp4eqqmt4xyx/Chineloo.avif?rlkey=krx6wro2fmzpm8waadn2v0f3g&st=p6ovpibt&dl=0",
//       "categories": [0]
//     },
//     {
//       "id": 1,
//       "title": "5 Signs Your UI/UX Design Is Not User Friendly",
//       excerpt: `Is your user engagement decreasing? Here is why! <br/><br/> User interface (UI) designs are like a cover of a book, people judge it before even knowing the content, so it is essential to adopt seamless user experience design services to impress your users.<br><br>As such, the power of UI design may be the difference between a very successful application and one that fails to make an impression or, worse, leaves a lasting negative impression on the user. You can't afford any UI UX design mistakes! And to help you prevent them and gauge whether your user interface is truly satisfactory, here are five key signs to watch out for.<br><br> <b style="color: #888; font-size: 18px;">1. Complex Navigation:</b> <br>Golden Krishna's philosophy, encapsulated in \"The Best Interface Is No Interface,\" underscores the importance of creating seamless user experiences where navigation occurs so smoothly that users are almost unaware of the interaction. But when this doesn't happen, navigation is complex. Conversely, confusing navigation can frustrate users, and a lack of user-friendliness becomes evident when users struggle to locate information or find their way around features.<br><br><b style="color: #888; font-size: 18px;">2. Inconsistent Design:</b> <br>Inconsistency in design elements, such as varying button styles, color schemes, or placement of key features, can lead to confusion. A lack of visual harmony makes it harder for users to predict the interface's behavior.<br><br><b style="color: #888; font-size: 18px;"> 3. Poor Error Handling:</b> <br>Inadequate or unclear error messages can frustrate users when something goes wrong. If error messages are cryptic, lack guidance, or fail to pinpoint issues, users may struggle to resolve problems effectively.<br><br><b style="color: #888; font-size: 18px;">4. Overwhelming Clutter:</b> <br>An excessively cluttered interface with too much information, options, or visual elements overwhelms users. A cluttered design makes it harder for users to focus on essential tasks and contributes to a less friendly user experience.<br><br><b style="color: #888; font-size: 18px;">5. Lack Of Feedback:</b> <br>If the interface doesn't provide feedback for user actions, such as confirmation messages or visual cues, users may feel uncertain about whether their actions were successful. This lack of feedback can lead to confusion and diminish the overall user experience.<br><br><b style="color: #888; font-size: 18px;">Conclusion:</b> <br>The impact of a poor user experience goes beyond immediate financial costs; it also influences user satisfaction, retention rates, brand reputation, customer loyalty, and overall business success. To mitigate these challenges, it is imperative to invest in user-centered design principles, undertake comprehensive UX research and testing, and consistently iterate based on user feedback.<br>This approach is vital for crafting exceptional user experiences that lead to improved engagement, increased conversions, and a competitive edge in the digital landscape.`,
//       "date": "11 March 2024",
//       "postImage": "https://i.postimg.cc/DF1mKTyh/Article-Pic-imageonline-co-9723919-1.avif",
//       "categories": [0]
//     },
//     {
//       "id": 2,
//       "title": "How To Create A Memorable Brand Identity?",
//       excerpt,
//       // "excerpt": "Introduction: <br>In today's crowded marketplace, customers are bombarded with visual noise. From logos to billboards, but how many of there's visual inundations truly resonate? <br>Here's a simple yet powerful test to gauge your brand's memorability: Can your customers draw your logo by heart? Pause for a moment and think about it. Now, let's unlock the secret of logo design that makes your brand unforgettable. <br><br>Table Of Content: <br>    •    <b>Why Simplicity Reigns Supreme</b><br>    ◦    Memorable<br>    ◦    Versatile<br>    ◦    Timeless Appeal<br>    ◦    Universal Communication<br>    •    The Ulevus Approach to Simplicity and Brand Identity<br>    ◦    Meaningful<br>    ◦    Visually Appealing<br>    ◦    Easy to Remember<br>    •    The Takeaway: A Simple Logo for a Lasting Impact<br>    Designing a Logo Your Customers Won't Forget<br><br>Why Simplicity Reigns Supreme <br>Flashy graphics and intricate details might seem impressive at first glance, but they can actually hinder your logo's effectiveness. Simple designs, on the other hand, cuts through the noise, capturing attention and leaving a lasting impression. <br>Beyond these, here are other several reasons why a simple logo design is superior to a complex one:<br>Memorable: Simple logos are easier to remember. With fewer elements to process, the human brain can readily store and recall the logo's key features. Think of the iconic swoosh of Nike or the bitten apple of Apple. These logos are instantly recognizable because of their clean and simple design.<br>Versatility: A simple logo can be easily adapted to different sizes and formats. This is essential for businesses that need their logo to appear on everything from billboards to business cards. A complex logo with intricate details can become a blurry mess when shrunk down, losing its impact.<br><br>Timeless Appeal: Trends come and go, but a well-designed simple logo will remain relevant for years to come. Avoid overly trendy design elements that might date your logo quickly.<br>Universal Communication: Simple logos can transcend cultural barriers. With fewer details to decipher, your logo is more likely to be understood by a wider audience.<br><br>The Ulevus Approach to Simplicity and Brand Identity<br>At Ulevus, we believe in the power of simplicity to create powerful brand identities. We work with our clients to develop logos that are:<br>    •    Meaningful: Your logo should represent your brand's core values and mission.<br>    •    Visually Appealing: Even a simple design can be aesthetically pleasing. We use color, shape, and typography strategically to create a logo that resonates with your target audience.<br>    •    Easy to Remember: We help you craft a logo that your customers can easily draw from memory, fostering brand recognition and recall.<br><br>The Takeaway: A Simple Logo for a Lasting Impact<br>Don't underestimate the power of simplicity in logo design.  A well-crafted, simple logo can be the cornerstone of a strong brand identity that leaves a lasting impression.<br><br>Design a Logo Your Customers Won't Forget<br>Is your current logo complex and forgettable?  Do you yearn for a brand identity that leaves a lasting impact? At Ulevus, we can help. <br>We are committed to helping businesses harness the power of simplicity to elevate their brand and leave a lasting impression. <br>Remember, in a world of complexity, simplicity is the ultimate sophistication.",
//       "date": "11 March 2024",
//       "postImage": "https://i.postimg.cc/KcGcXFSf/Article-2-imageonline-co-5881303-1.avif",
//       "modalImage": "https://i.postimg.cc/Bs4nP5LF/Article-2-Inner-imageonline-co-5128737-1.avif",
//       "categories": [0]
//     },
    
    
//     {
//       id: 3,
//       title: "Effective Feedback Tips in a Workplace",
//       excerpt: `Giving helpful feedback is vital for growth in a professional setting. Here are three strategies to offer effective feedback:<br> 1. <b style="color: #888; font-size: 18px;">Provide Specific and Actionable Input:</b><br>When sharing feedback, focus on distinct actions rather than generalities. This helps the recipient understand what needs improvement and how to proceed.<br>2. <b style="color: #888; font-size: 18px;">Balance Positivity and Constructive Criticism:</b><br>While addressing areas for improvement, also highlight achievements and strengths. This approach motivates while allowing room for development.<br>3. <b style="color: #888; font-size: 18px;">Encourage Two-Way Dialogue:</b><br>Transform feedback into a conversation, not a one-way delivery. Encourage recipients to share their thoughts, fostering collaboration and respect.`,
//       date: "11 March 2024",
//       postImage: "https://i.postimg.cc/ZT0Ckv0s/Article-3-imageonline-co-8649636-1.avif",
//       modalImage: "https://i.postimg.cc/hcrjf1d3/Article-3-Inner-Page-imageonline-co-5111500-2.avif",
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
//       id: 5,
//       title: "The Case for Business Networking",
//       excerpt: `Everyone talks about competitors in business. It's a constant game of chess. Outmaneuvering rivals, pushing them out of the market—or so the traditional narrative goes. <br><br>But what if there's a better way? What if, instead of viewing other businesses solely as adversaries, we saw them as potential co-players in a more giant game of innovation and progress? This collaborative spirit is exactly what fuels the power of business networking.<br><br> <b style="color: #888; font-size: 18px;">Why Is Collaboration Important?</b><br>Think of it this way: wouldn't it be more productive to learn from and inspire each other rather than constantly looking for ways to push each other down? Networking events provide fertile ground for this kind of healthy competition and collaboration.<br><br>At Ulevus, we understand this value, so we're proud to see our Creative Director, Arnold Sigala, actively participating in the business community. <br>Recently, Arnold represented Ulevus as a design judge at the Hustlers Conference Buea, organized by Kouts Divine and the team. This prestigious event brings together creatives, designers, and business leaders, fostering a dynamic environment for networking and learning. <br><br><b style="color: #888; font-size: 18px;">Building Bridges Through Expertise</b><br>Arnold's participation wasn't just about judging designs. It was about connecting with fellow creatives, sharing his expertise, and gaining valuable insights from others. By being present at the Hustlers Conference Buea, Ulevus demonstrates our commitment to:<br>Supporting the creative community: We believe in empowering the next generation of designers and businesses. Events like the Hustlers Conference Buea provide a platform for them to showcase their talent and connect with industry professionals. <br> <b style="color: #888; font-size: 18px;">Fostering collaboration:</b> Business thrives on connections. Participating in these events opens doors to potential partnerships and collaborations, allowing us to learn from others and create even more innovative solutions for our clients.<br><br> <b style="color: #888; font-size: 18px;">Beyond Design</b> <br>Ulevus isn't just about creating stunning brand identities and UI/UX designs; it's about building meaningful connections. We believe that strong relationships are the foundation for successful businesses, and we will continue to reinforce them. <br>Looking to expand your network and take your design skills to the next level? We encourage you to seek out similar events in your area. But if you're in Cameroon, we have some exciting news for you!<br>Mark your calendars for April 16th!  Ulevus is thrilled to host the Ulevus Creative Evening, an electrifying event designed to ignite inspiration, spark knowledge-sharing, and most importantly, foster collaboration amongst designers. To secure your spot, sign up here.`,
//       date: "11 March 2024",
//       postImage: "https://i.postimg.cc/FhnT3Kn5/BN-1.avif",
//       // modalImage: "https://dl.dropboxusercontent.com/scl/fi/btk3fuoich4p1kgqzy0y9/Article-3-Inner-Page-imageonline.co-5111500.avif?rlkey=lc08qnzfttr2rnnv9dw0ca2gc&dl=0",
//       categories: [0]
//     },
//     {
//       id: 7,
//       title: "",
//       excerpt: "We are excited to have our creative director, Arnold Sigala to represent Ulevus as one of the design judges at the Hustlers Conference Buea. Organized by Kouts Divine and team.",
//       date: "11 March 2024",
//       postImage: "https://i.postimg.cc/y6K1NDYH/Fragggggme-173-1.avif",
//       // modalImage: "https://dl.dropboxusercontent.com/scl/fi/btk3fuoich4p1kgqzy0y9/Article-3-Inner-Page-imageonline.co-5111500.avif?rlkey=lc08qnzfttr2rnnv9dw0ca2gc&dl=0",
//       categories: [1]
//     },

//     {
//       "id": 8,
//       "title": "From Palette to Perception: The Strategic Role of Color in Brand Identity Design.",
//       "excerpt": "Every element of your brand identity shapes how the world perceives you. And color is no different. It's more than just aesthetics; it's your brand's emotional language. <b style=\"color: #888; font-size: 18px;\">Forget the myth of the random color picker.</b> Every color has significance, and if not properly chosen, it can mar your brand and ruin your identity. While a vibrant palette might catch the eye, you must ensure it truly resonates with your brand's core values. <br/><br/> Does it evoke the emotions you want your audience to feel? Imagine a children's daycare center awash in black and grey—not exactly an inspiring choice. No matter how professional and great the center is, most parents won't send their children there. <br/><br/> This is where strategic color scheming comes in. It's about meticulously crafting a palette that tells your brand's story. Here at Ulevus, we don't just pick colors; we choose them with deliberate precision. <br/><br/> <b style=\"color: #888; font-size: 18px;\">Why is this so important?</b> <br/> It's essential because colors have the power to: <br/> <b style=\"color: #888; font-size: 18px;\"> • Evoke Emotions:</b> A fiery red ignites passion, while a calming blue inspires trust. We use color psychology to select hues that elicit the specific feelings you want your brand to evoke. <br/> <b style=\"color: #888; font-size: 18px;\">• Convey Brand Values:</b> Is your brand innovative and bold? Energetic oranges and yellows might be a perfect fit. Do you prioritize trust and security? Earthy tones and deep blues might resonate better. <br/> <b style=\"color: #888; font-size: 18px;\"> • Showcase Brand Personality:</b> Colors can inject personality into your brand. A playful brand might embrace a whimsical mix, while a sophisticated brand might lean towards a more elegant palette. <br/><br/> <b style=\"color: #888; font-size: 18px;\">Colors are more than just aesthetics – they tell a story.</b> At Ulevus, we understand that colors aren't just hues; they're powerful tools that speak volumes about your brand. We meticulously craft color palettes to evoke emotions, convey brand values, and showcase brand personality. Every color choice is a strategic decision, from vibrant tones that energize to soothing shades that inspire trust. <br/><br/> <b style=\"color: #888; font-size: 18px;\">Browse through our recent color palettes for:</b> <br/> • Echolink Solutions <br/> • Lewa Academy <br/> • Apprey PR <br/>• Silicon Mountain Conference 2023 (We will hyperlink the link to each case study) <br/><br/> See how colors can be used to tell a unique brand story. <b style=\"color: #888; font-size: 18px;\">Ready to craft a color palette that sings your brand's anthem?</b> Contact us today!",
//       "date": "05 March 2024",
//       "postImage": "https://i.postimg.cc/b8XqJPXC/pexels-anthony-50721.avif",
//       "categories": [0]
//     },    
//     {
//       "id": 9,
//       "title": "How Collaboration Fuels Innovation In Business ",
//       "excerpt": `Everyone talks about competitors in business. It's a constant game of chess. Outmaneuvering rivals, pushing them out of the market—or so the traditional narrative goes. But what if there's a better way? What if, instead of viewing other businesses solely as adversaries, we saw them as potential co-players in a more giant game of innovation and progress? This collaborative spirit is exactly what fuels the power of business networking. <br/><br/> <b style="color: #888; font-size: 18px;">Why Is Collaboration Important?</b> <br/> <b style="color: #888; font-size: 18px;">Think of it this way:</b> wouldn't it be more productive to learn from and inspire each other rather than constantly looking for ways to push each other down? Networking events provide fertile ground for this kind of healthy competition and collaboration. <br/> At Ulevus, we understand this value, so we're proud to see our Creative Director, Arnold Sigala, actively participating in the business community. Recently, Arnold represented Ulevus as a design judge at the Hustlers Conference Buea, organized by Kouts Divine and the team. This prestigious event brings together creatives, designers, and business leaders, fostering a dynamic environment for networking and learning. <br/> <b style="color: #888; font-size: 18px;">Building Bridges Through Expertise</b> <br/> Arnold's participation wasn't just about judging designs. It was about connecting with fellow creatives, sharing his expertise, and gaining valuable insights from others. By being present at the Hustlers Conference Buea, Ulevus demonstrates our commitment to: <br/> <b style="color: #888; font-size: 18px;"> • Supporting the creative community: </b> We believe in empowering the next generation of designers and businesses. Events like the Hustlers Conference Buea provide a platform for them to showcase their talent and connect with industry professionals. <br/> <b style="color: #888; font-size: 18px;"> • Fostering collaboration:</b> Business thrives on connections. Participating in these events opens doors to potential partnerships and collaborations, allowing us to learn from others and create even more innovative solutions for our clients. <br/><br/> <b style="color: #888; font-size: 18px;">Beyond Design</b> <br/> Ulevus isn't just about creating stunning brand identities and UI/UX designs; it's about building meaningful connections. We believe that strong relationships are the foundation for successful businesses and will continue reinforcing them. <br/> Looking to expand your network and take your design skills to the next level? We encourage you to seek out similar events in your area. But if you're in Cameroon, we have some exciting news for you! Whether you're a creative or a business owner, we host events packed with insights, solutions, and networking opportunities. <br/> Subscribe to our newsletter to stay informed and be the first to register!`,
//       "date": "21 March 2024",
//       "postImage": "https://i.postimg.cc/x99Cd2mD/Ulevus-Article.avif",
//       // "modalImage": "https://dl.dropboxusercontent.com/scl/fi/vld95tgenfa5j3k161woz/Diversity-Article-Inner-page.avif?rlkey=ktzzrn20y0eizq5jaloryu185&dl=0",
//       "categories": [0]
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
//     {
//       "id": 11,
//       "title": "The Many Hats of A Designer: Mindset and Skillset for Innovation by Aboubakar Sidiki.",
//       "excerpt": `At our recent event, the Ulevus Creatives Evening, Mr. Aboubakar Sidiki, a seasoned Business Solutions Designer and Sales Operations Senior Manager at MTN Cameroon, offered enlightened perspectives on who a designer is and whether design is a viable career path. Let's unravel the key insights shared during his presentation. <br/><br/>Mr. Aboubakar commenced his presentation by explaining that designers are the creative force behind the world around us. Designers are the creative force behind everything from website navigation to the furniture we use and the clothes we wear. But what exactly makes a designer? He revealed that it combines two key ingredients: a <b style="color: #888; font-size: 18px;">human-centered mindset</b> and a strong <b style="color: #888; font-size: 18px;">skill set.</b> <br/><br/><b style="color: #888; font-size: 18px;">A Designer's Mindset: Empathy First</b> <br/> At the core of a designer's thinking lies <b style="color: #888; font-size: 18px;">human-centered innovation.</b> Therefore, it is important to understand and address the real needs of people. Great designers don't just create things; they create solutions that improve lives. To fully immerse yourself in the human-centered approach, you must; <br/><b style="color: #888; font-size: 18px;">• Understand Human Needs:</b> You must be empathetic and able to identify your users' challenges and desires. <br/> <b style="color: #888; font-size: 18px;"> • Embrace Interactive Methods:</b> The design process is not a linear path. You must embrace a cycle of <b style="color: #888; font-size: 18px;">trying, learning, and refining</b> your solutions based on user feedback. <br/> <b style="color: #888; font-size: 18px;"> • Adopt Creative Problem Solving:</b> You must be unafraid to think outside the box. Then, approach challenges with imagination and develop innovative solutions. <br/> <b style="color: #888; font-size: 18px;"> • Interdisciplinary Collaboration:</b> No designer is an island. Collaboration across different fields is key to creating truly holistic solutions. <br/><br/> <b style="color: #888; font-size: 18px;">The Tools of the Trade: A Diverse Skillset</b> <br/> Mr. Aboukar explained further that while a designer's mindset is crucial, a strong skillset is equally important. He highlighted some of the key skills needed to thrive in the design world: <br/> <b style="color: #888; font-size: 18px;"> • Creativity:</b> The ability to generate original ideas and think outside the box is essential. <br/> <b style="color: #888; font-size: 18px;"> • Visual Communication:</b> You must effectively convey information and ideas through visuals like layouts, typography, and color. <br/> <b style="color: #888; font-size: 18px;"> • Problem-solving:</b> Analytical thinking skills are needed to identify challenges and develop effective solutions. <br/> <b style="color: #888; font-size: 18px;"> • Collaboration:</b> The ability to work effectively with others, including clients, developers, and other designers, is key to success. <br/> <b style="color: #888; font-size: 18px;"> • Mastering Digital Technology:</b> A solid foundation in design software like Sketch, Figma, or Adobe Creative Suite is a must. Depending on the specialization, some designers may also need coding skills or proficiency in CAD software. <br/><br/> <b style="color: #888; font-size: 18px;">The World of Design: Where Creativity Takes Shape</b> <br/> Design is a vast field with numerous specializations. Here are just a few examples: <br/> <b style="color: #888; font-size: 18px;"> • Graphic Design:</b> Creates visual concepts for print and digital media. <br/> <b style="color: #888; font-size: 18px;"> • UX/UI Design:</b> Focuses on user experience and user interface design for websites and applications. <br/> <b style="color: #888; font-size: 18px;"> • Industrial Product Design:</b> Designs physical products, from furniture to electronics. <br/> <b style="color: #888; font-size: 18px;"> • Service Design:</b> Creates and improves services to enhance user experience. <br/> <b style="color: #888; font-size: 18px;"> • Business Design:</b> Applies design thinking to solve business problems and improve processes. <br/> <b style="color: #888; font-size: 18px;"> • Game Designer:</b> Creates the gameplay mechanics and overall experience of video games. <br/> <b style="color: #888; font-size: 18px;"> • Architects & Interior Designers:</b> Design and plan buildings and living spaces. <br/> <b style="color: #888; font-size: 18px;"> • Fashion Designer:</b> Designs clothing and accessories. <br/><br/> <b style="color: #888; font-size: 18px;"> The Ultimate Weapon</b> <br/> In conclusion, Mr. Aboubakar summarized the essence of a designer's journey with the quote, \"Change Is The End Result Of All True Learning.\" He emphasized the importance of continuous learning, exploration, and practice, which is essential for growth in this ever-evolving field.`,
//       "date": "6 April 2024",
//       "postImage": "https://i.postimg.cc/mb52V15B/Ulevus-Creatives-Evening-Bue-Aboubakar.avif",
//       // "modalImage": "https://dl.dropboxusercontent.com/scl/fi/vld95tgenfa5j3k161woz/Diversity-Article-Inner-page.avif?rlkey=ktzzrn20y0eizq5jaloryu185&dl=0",
//       "categories": [0]
//     },
//     {
//       id: 12,
//       title: "Ulevus Creatives Evening Buea What is Design  by Ngumih Fien—UX Designer ",
//       "excerpt": `<b style="color: #888; font-size: 18px;">What is design? To answer this question, at the just-concluded</b> Ulevus Creatives Evening, Ngumih Fien commenced by shedding light on the dual nature of design—both a noun and a verb, reflecting the tangible outcome and the dynamic process involved in its creation.<br/><br/><b style="color: #888; font-size: 18px;">The Noun:</b><br/>- Design refers to the final product, plan, or solution created through the design process.<br/><br/><b style="color: #888; font-size: 18px;">The Verb:</b><br/>- It describes the act of planning, creating, and developing something.<br/><br/><b style="color: #888; font-size: 18px;">Key Factors of Design:</b><br/>- Drawing from the wisdom of design guru Don Norman, Ngumih elaborated on essential design principles:<br/> <b style="color: #888; font-size: 18px;"> • Visibility:</b> Ngumih stressed the importance of making crucial information and functions readily apparent to users, ensuring a seamless experience. Design should make relevant information and functions visible to users. As such, users should be able to quickly perceive and understand how to interact with a product or system.<br/> <b style="color: #888; font-size: 18px;"> • Feedback:</b> Designs should provide clear and timely feedback to users, informing them about the state of the system and the outcome of their actions.<br/> <b style="color: #888; font-size: 18px;"> • Affordances:</b>  Ngumih highlighted the incorporation of affordances into designs, providing intuitive cues that facilitate user understanding and engagement. A good example is the door handle, which affords pushing, pulling, or turning, depending on the design.<br/>  <b style="color: #888; font-size: 18px;"> • Mapping:</b> Design should create a clear and natural mapping between controls and their corresponding actions or functions. Mapping helps users understand the relationship between their actions and the system's response. An excellent example of mapping is the switches when you enter a house and the corresponding bulbs they turn on.<br/>  <b style="color: #888; font-size: 18px;"> • Constraints:</b> Design should utilize physical, logical, and cultural constraints to guide users' actions and prevent errors. Constraints limit the possible interactions and steer users toward desired behaviors. An example of a physical constraint is the holes in scissors, which limit the number of fingers passing through them.<br/>  <b style="color: #888; font-size: 18px;"> • Usability:</b> Design should prioritize usability, ensuring that products and systems are easy to learn, efficient to use, and error-free. Ngumih further explained that usability testing should be carried out to address any usability issues and ensure the design is usable.<br/><br/>In conclusion, echoing the sentiments of design luminary Saul Bass, Ngumih reiterated that \"Design is the method of putting form and content together,\" encapsulating the essence of her insightful presentation at the Ulevus Creatives Evening. (Book recommendations referenced in the presentation: \"The Design of Everyday Things\" by Don Norman and \"Don't Make Me Think\" by Steve Krug.)`,
//       date: "10 April 2024",
//       postImage: "https://i.postimg.cc/jttKHhSy/Ulevus-Creatives-Evening-Buea-Ngumih-Fien.avif",
//       // modalImage: "https://dl.dropboxusercontent.com/scl/fi/btk3fuoich4p1kgqzy0y9/Article-3-Inner-Page-imageonline.co-5111500.avif?rlkey=lc08qnzfttr2rnnv9dw0ca2gc&dl=0",
//       categories: [1]
//     },
//     {
//       "id": 13,
//       "title": "Ulevus Partners with IFYRA 2024 to Empower Young Farmers",
//       "excerpt": `Ulevus, a design and communications company based in Cameroon, is delighted to announce a successful partnership with the Ideal Farmers Youth Recognition Award (IFYRA) 2024, an initiative of IDEAL FARMERS LTD, held in Cameroon. <br/><br/> This collaboration underlines Ulevus' commitment to giving back to the community and fostering positive change. <br/><br/> IFYRA is an annual event that identifies, recognizes, motivates, and promotes young people in Cameroon's agricultural sector. By celebrating these rising stars and unseen champions, IFYRA aims to keep them engaged, attract investment, and showcase the importance of agriculture in the country. <br/><br/> <b style="color: #888; font-size: 18px;">Ulevus' Role in Empowering Young Farmers:</b> <br/> Ulevus partnered with IFYRA to optimize its brand identity and better engage young audiences. Here is how: <br/> • Ulevus designed the IFYRA brand identity, crafting the logo, color palette, typography, and other design elements representing a youthful, forward-thinking, and dynamic agricultural organization. <br/> • The hand-sketched logo incorporates nurturing, growth, reward, and elegance – highlighting the significance of agriculture and fostering a renewed appreciation for the field. <br/> • Opted for vibrant green hues: The color palette speaks to growth, new life, and the essence of nature. Ulevus' inclusion of plant veins within the design pattern conveys the efficiency, energy, and innovation that the younger generation brings to the agricultural sector. <br/> • Adopted an enthusiastic tone of voice: The tone used in the IFYRA brand identity project resonates with enthusiasm and a spirit of celebration, perfectly capturing the essence of the awards. <br/> • Cohesive Brand Experience: Ulevus also implemented the design elements across IFYRA's social media platforms and collaborated with their in-house designer to ensure a consistent brand identity across all touchpoints. <br/><br/> This successful partnership demonstrates Ulevus' dedication to using design as a force for positive change within Cameroon. <br/><br/> Learn more about Ulevus' commitment to social responsibility here: (hyperlink 'here' with Ulevus Business Evening url)`,
//       "date": "24 February 2024",
//       "postImage": "https://i.postimg.cc/339w4cjy/Ulevus-Partners-with-Ifyra.avif",
//       // "modalImage": "https://dl.dropboxusercontent.com/scl/fi/vld95tgenfa5j3k161woz/Diversity-Article-Inner-page.avif?rlkey=ktzzrn20y0eizq5jaloryu185&dl=0",
//       "categories": [2]
//     }  
//   ]);

//   const [categories] = useState([
//     { id: 1, name: "Events" },
//     { id: 2, name: "News" },
//   ]);

//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [modalPost, setModalPost] = useState(null);

//   const handleReadMore = (index) => {
//     const clickedPost = filterPosts()[index]; 
//     const postWithImage = { ...clickedPost, image: clickedPost.image };
//     setModalPost(postWithImage);
//   };
  

//   const openModal = (image) => {
//     setModalImage(image);
//     setModalIsOpen(true);
//   };

//   const closeModal = () => {
//     setModalIsOpen(false);
//   };

//   const handleCategoryChange = (value) => {
//     setSelectedCategory(value);
//   };

//   const filterPosts = () => {
//     if (selectedCategory === 'all') {
//       return posts;
//     }
//     return posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
//   };

//   return (
//     <>
//       <div className="post-grid section__padding">
//         <div className="category-buttons">
//           <button
//             className={selectedCategory === 'all' ? 'active' : ''}
//             onClick={() => handleCategoryChange('all')}
//           >
//             Articles
//           </button>
//           {categories.map((category) => (
//             <button
//               key={category.id}
//               className={selectedCategory === category.id.toString() ? 'active' : ''}
//               onClick={() => handleCategoryChange(category.id.toString())}
//             >
//               {category.name}
//             </button>
//           ))}
//         </div>
//         <Masonry columns={{ 640: 1, 768: 2, 1024: 3 }} gap={16} columnProps={{ className: 'post-container' }}>
//           {filterPosts().map((post, index) => (
//             <div key={post.id} style={{marginBottom: "50px"}}>
//               <BlurhashImg 
//                 src={post.postImage} 
//                 alt="Post Featured Image" 
//                 className="responsive blur_load"
//                 id={`clickableImage${post.id}`}
//                 loading="lazy" placeholderColor="#888"/>
//                 {/* onClick={() => openModal(post.postImage)} */}
//               {/* <img
//                 src={post.postImage}
//                 alt="Post Featured Image"
//                 className="responsive blur_load"
//                 id={`clickableImage${post.id}`}
//                 loading="lazy"
//                 // onClick={() => openModal(post.postImage)}
//               /> */}
//               <p style={{color: "#888"}}>{post.date}</p>
//               <h1>{post.title}</h1>
//               <p dangerouslySetInnerHTML={{ __html: post.excerpt.length > 180 ? post.excerpt.slice(0, 180) : post.excerpt }} style={{ color: '#888' }}></p>
//               {/* <p dangerouslySetInnerHTML={{ __html: post.excerpt }} style={{ color: 'white' }}>
//                 {post.excerpt.length > 180 ? post.excerpt.slice(0, 180) : post.excerpt}
//               </p> */}
//               <button
//                 onClick={() => handleReadMore(index)}
//                 style={{ marginTop: '18px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px", fontFamily: "Syne"}}
//               >
//                 Read More
//               </button>
//             </div>
//           ))}
//         </Masonry>
//         <Modal isOpen={modalIsOpen} onRequestClose={closeModal} image={modalImage} />
//         {modalPost && <Modale post={modalPost} onClose={() => setModalPost(null)} />}
//       </div>
//     </>
//   );
// };

// export default Post;





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './post.css';
// import Modal from '../../../containers/feed/Feed';
// import { Link } from 'react-router-dom';

// const Post = () => {
//   const [posts, setPosts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [modalPost, setModalPost] = useState(null);

//   const handleReadMore = (index) => {
//     const clickedPost = posts[index];
//     setModalPost(clickedPost);
//   };

//   const handleCategoryChange = (value) => {
//     setSelectedCategory(value);
//   };

//   const fetchData = async () => {
//     try {
//       const response = await axios.get('http://localhost/ulevus/wp-json/wp/v2/posts?_embed');
//       setPosts(response.data);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       console.error('Response:', error.response);
//     }
//   };

//   useEffect(() => {
//     axios.get('http://localhost/ulevus/wp-json/wp/v2/categories')
//       .then((res) => {
//         const filteredCategories = res.data.filter(category => category.name !== 'Uncategorized' && category.name !== 'Articles' && category.articles !== 'Articles' && category.talks !== 'Talks');
//         setCategories(filteredCategories);
//       })
//       .catch((error) => {
//         console.error('Error fetching categories:', error);
//       });

//     fetchData();
//   }, []);

//   useEffect(() => {
//     window.addEventListener('resize', rearrangeGrid);
//     return () => {
//       window.removeEventListener('resize', rearrangeGrid);
//     };
//   }, []);

//   useEffect(() => {
//     rearrangeGrid();
//   }, [posts]);

//   const rearrangeGrid = () => {
//     const grid = document.querySelector('.post-grid');
//     const posts = grid.querySelectorAll('.post-container');

//     let currentRow = 1;
//     let currentHeight = 0;
//     let maxHeight = 0;

//     posts.forEach(post => {
//       if (currentHeight === 0) {
//         currentRow++;
//         maxHeight = 0;
//         grid.style.gridTemplateRows += ' auto';
//       }

//       const postHeight = post.offsetHeight;

//       if (postHeight > maxHeight) {
//         maxHeight = postHeight;
//       }

//       currentHeight += postHeight;

//       if (currentHeight > maxHeight) {
//         currentHeight = postHeight;
//       }

//       post.style.gridRow = `${currentRow} / span ${Math.ceil(postHeight / maxHeight)}`;
//     });
//   };

//   const filterPosts = () => {
//     if (selectedCategory === 'all') {
//       return posts;
//     }

//     return posts.filter(post => post.categories.includes(parseInt(selectedCategory, 10)));
//   };

//   return (
//     <>
//       <div className="post-grid section__padding">
//         <div className="category-buttons">
//           <button
//             className={selectedCategory === 'all' ? 'active' : ''}
//             onClick={() => handleCategoryChange('all')}
//           >
//             All
//           </button>
//           {categories.map((category) => (
//             <button
//               key={category.id}
//               className={selectedCategory === category.id.toString() ? 'active' : ''}
//               onClick={() => handleCategoryChange(category.id.toString())}
//             >
//               {category.name}
//             </button>
//           ))}
//           <div className="read-more-button-container">
//             {filterPosts().map((post, index) => (
//               <Link key={post.id} to={`/postDetails/${post.id}`} className="read-more-button">
//                 Read More
//               </Link>
//             ))}
//           </div>
//         </div>
//         {filterPosts().map((post, index) => (
//           <div key={post.id} className="post-container">
//             <img
//               src={post._embedded['wp:featuredmedia']['0'].source_url || 'http://localhost/ulevus/path/to/default-image.jpg'}
//               alt="Post Featured Image"
//               className="responsive blur_load"
//               id={`clickableImage${post.id}`}
//               loading="lazy"
//             />
//             <p>{post.date}</p>
//             <h1>{post.title.rendered}</h1>
//             <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} style={{ color: 'white' }}></p>
//             <button onClick={() => handleReadMore(index)} style={{ marginTop: '18px', textDecoration: 'underline', backgroundColor: "#000000", color: "#ffffff", border: 'none', fontSize: "16px"}}>Read More</button>
//           </div>
//         ))}
//         {modalPost && <Modal post={modalPost} onClose={() => setModalPost(null)} />}
//       </div>
//     </>
//   );
// };

// export default Post;



