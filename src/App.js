// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
// import './App.css';
// import { Footer } from './containers';
// import { Navbar, Preloader } from './@/components';
// import ReactGA from "react-ga4";
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from "./firebase";
// import LazyLoad from 'react-lazyload';

// import Home from './screens/home/Home';
// import Work from './screens/work/Work';
// import TeamDetails from './screens/teamDetails/TeamDetails';
// import Learn from './screens/learn/Learn';
// import Contact from './screens/contact/Contact';
// import About from './screens/about/About';
// import ProjectDetails from './screens/projectDetails/projectDetails';
// import NoPage from './screens/noPage/NoPage';

// const TRACKING_ID = "G-GQE2TFY87X"; 
// ReactGA.initialize(TRACKING_ID);

// ReactGA.send({ 
//   hitType: "pageview", 
//   page: window.location.pathname,
//   title: "Custom Title"
// });

// const sectionVariants = {
//   hidden: { opacity: 1, y: 50 },
//   visible: { opacity: 1, y: 0 },
// };

// const ArrowUpIcon = () => (
//   <svg
//     className="arrow-up-icon"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <polyline points="5 12 12 5 19 12" transform="rotate(90 12 12)"></polyline>
//     <line x1="12" y1="19" x2="12" y2="5" transform="rotate(90 12 12)"></line>
//   </svg>
// );

// const ScrollToTop = () => {
//   const [showButton, setShowButton] = useState(false);
//   const { pathname } = useLocation();

//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollTop = window.pageYOffset;
//       const windowHeight = window.innerHeight;
//       const documentHeight = document.documentElement.scrollHeight;

//       if (scrollTop > 0.60 * (documentHeight - windowHeight)) {
//         setShowButton(true);
//       } else {
//         setShowButton(false);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);

//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, [pathname]);

//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   return (
//     <>
//       {showButton && (
//         <div className="back-to-top" onClick={scrollToTop}>
//           <ArrowUpIcon />
//         </div>
//       )}
//     </>
//   );
// };

// const App = () => {
//   const [progress, setProgress] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [articles, setArticles] = useState([]);

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       setLoading(false);
//     }, 2000);

//     return () => clearTimeout(timeout);
//   }, []);

//   useEffect(() => {
//     const fetchArticles = async () => {
//       setProgress(30);
//       try {
//         const newsRef = collection(db, 'news');
//         const querySnapshot = await getDocs(newsRef);
//         const fetchedArticles = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setArticles(fetchedArticles);
//         setProgress(100);
//       } catch (err) {
//         console.error('Error fetching articles:', err);
//         setProgress(100);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchArticles();
//   }, []);

//   const categorizeArticles = (category) => articles.filter(article => article.category.toLowerCase() === category.toLowerCase());

//   return (
//     <Router>
//       <div className="App">
//         {loading ? (
//           <Preloader />
//         ) : (
//           <>
//             <Navbar />
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/work" element={<Work />} />
//               <Route path="/work/:slug" element={<ProjectDetails />} /> 
//               <Route path="/team/:slug" element={<TeamDetails />} />
//               <Route path="/ideas" element={<Learn articles={articles} />} />
//               <Route path="/contact" element={<Contact />} />
//               <Route path="/about" element={<About />} />
//             </Routes>

//             <Footer />
//             <ScrollToTop />
//           </>
//         )}
//       </div>
//     </Router>
//   );
// };

// export default App;








import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store/store';
import { Layout, ConfigProvider } from 'antd';
import AppHeader from './components/AppHeader';
import AppSider from './components/AppSider';
import TechnicianPage from './pages/TechnicianPage';
import GeneratorHistory from './pages/GeneratorHistory';
import TowerAdminPage from './pages/admin/TowerAdminPage';
import GeneratorForm from './features/generators/components/GeneratorForm';
import {
  DashboardPage,
  GeneratorsPage,
  TowersPage,
  TelemetryPage,
  MaintenancePage,
  AlertsPage,
  LoginPage,
} from './pages';
import './styles/global.css';
import GeneratorAdminPage from './pages/admin/GeneratorAdminPage';

const { Content } = Layout;

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider direction="ltr">
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <AppSider />
            <Layout>
              <AppHeader />
              <Content style={{ margin: '24px 16px 0' }}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/generators" element={<GeneratorsPage />} />
                  <Route path="/towers" element={<TowersPage />} />
                  <Route path="/telemetry" element={<TelemetryPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/technician" element={<TechnicianPage />} />
                  <Route path="/generators/:id/history" element={<GeneratorHistory />} />
                  <Route path='/admin/towers' element={<TowerAdminPage />} />
                  <Route path="/admin/generators" element={<GeneratorAdminPage />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;