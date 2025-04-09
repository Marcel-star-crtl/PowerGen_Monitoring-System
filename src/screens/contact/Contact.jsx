// import React, { useState } from 'react';
// // import { motion } from 'framer-motion/dist/framer-motion';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import L from 'leaflet'; 
// import 'leaflet/dist/leaflet.css';
// import './contact.css';
// import customMarkerIcon from '../../main_assets/maker.png';
// import ulevusLogo from "../../main_assets/logo1.png"; 
// import axios from 'axios';

// const Contact = () => {
//   const mapCenter = [4.1558, 9.2313];
//   const mailchimpApiKey = 'YOUR_MAILCHIMP_API_KEY';
//   const mailchimpListId = 'YOUR_MAILCHIMP_LIST_ID';
//   const customIcon = new L.Icon({
//     iconUrl: customMarkerIcon,
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     tooltipAnchor: [16, -28],
//     shadowSize: [41, 41],
//   });

//   const [formData, setFormData] = useState({
//     category: '',
//     name: '',
//     email: '',
//     phoneNumber: '',
//     message: '',
//   });

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       // Send data to WordPress
//       const responseWordPress = await fetch('http://localhost/ulevus/wp-json/custom/v1/contact-form', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const dataWordPress = await responseWordPress.json();
//       console.log('WordPress Response:', dataWordPress);

//       // Send data to Mailchimp
//       const responseMailchimp = await axios.post(
//         `https://<dc>.api.mailchimp.com/3.0/lists/${mailchimpListId}/members`,
//         {
//           email_address: formData.email,
//           status: 'subscribed',
//           merge_fields: {
//             FNAME: formData.name,
//             PHONE: formData.phoneNumber,
//             MESSAGE: formData.message,
//             // Add other merge fields as needed
//           },
//         },
//         {
//           headers: {
//             Authorization: `apikey ${mailchimpApiKey}`,
//           },
//         }
//       );

//       console.log('Mailchimp Response:', responseMailchimp.data);

//       // Reset the form after submission
//       setFormData({
//         category: '',
//         name: '',
//         email: '',
//         phoneNumber: '',
//         message: '',
//       });
//     } catch (error) {
//       console.error('Error submitting form:', error);
//     }
//   };


//   return (
//     // <motion.div className="contact section__padding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//     <div className="contact section__padding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <div className="map-container">
//         <MapContainer center={mapCenter} zoom={13} style={{ height: '500px', width: '100%' }}>
//           <TileLayer
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           />
//           <Marker position={mapCenter} icon={customIcon}>
//             <Popup>A marker on the map!</Popup>
//           </Marker>
//         </MapContainer>
//       </div>

//       <div className="contact-form">
//         <form onSubmit={handleSubmit}>
//           <div className='contact-info'>
//             <p>Mountain Hub <br/> Top Floor 1st Trust <br/> building <br/> Great Soppo <br/> Buea Cameroon </p>
//             <p>Email: info@ulevus.com <br/>CALL US: <br/> Cameroon: +237 679623977 <br/>  United States +18728102021</p>
//           </div>
//           <div className="label-input-pair">
//             <label htmlFor="category">Select a Category:</label>
//             <select id="category" name="category" required onChange={handleChange} value={formData.category}>
//               <option value="" disabled>Select a category</option>
//               <option value="2">1</option>
//               <option value="3">2</option>
//               <option value="3">3</option>
//               <option value="3">4</option>
//             </select>
//           </div>


//           <div className="label-input-pair">
//             <label htmlFor="name">Name:</label>
//             <input type="text" id="name" name="name" required placeholder="Enter your name" />
//           </div>

//           <div className="label-input-pair">
//             <label htmlFor="email">Email:</label>
//             <input type="email" id="email" name="email" required placeholder="Enter your email" />
//           </div>

//           <div className="label-input-pair">
//             <label htmlFor="phoneNumber">Phone Number:</label>
//             <input
//               type="tel"
//               id="phoneNumber"
//               name="phoneNumber"
//               pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" 
//               placeholder="+237-670-000000" 
//               required
//             />
//           </div>

//           <div className="label-input-pair">
//             <label htmlFor="message">State/Region/Province and Country:</label>
//             <input type="text" id="message" name="message" required placeholder="Enter your state/region/province and country" />
//           </div>

//           <div className="label-input-pair">
//             <label htmlFor="message">Message:</label>
//             <textarea id="message" name="message" required placeholder="Enter your message" onChange={handleChange} value={formData.message}></textarea>
//           </div>

//           <div class="button-container">
//             <button type="submit">Submit</button>
//           </div>
//         </form>
//       </div>
//     </div> 
//     // </motion.div>
//   );
// };

// export default Contact;




import React from 'react';
import './contact.css';
// import office1 from "../../main_assets/office1.avif";
// import office2 from "../../main_assets/office2.avif";

const Contact = () => {
  return (
    <div className="contact section__padding">
      <div className="contact-form">
        <div className='contact-info'>
          <div className="image-container">
            <img src="https://dl.dropboxusercontent.com/scl/fi/59324mf8cg7qjat0fxtkh/mask-group.avif?rlkey=a2xqv02v1tqauvvcha89toh11&dl=0" alt="Ulevus Logo" className="logo-image" />
            <h1>Papa Douala Logpom, Bassong, Douala. </h1>
            {/* <p>contact@ulevus.com <br/>+237-67-962-3977  <br/><br/><br/> Mountain Hub <br/> Top Floor 1st Trust Building, <br/> Great Soppo, Buea <br /> Cameroon </p> */}
            <p>info@ulevus.com <br/>+237-67-962-3977</p>
          </div>
          <div className="image-container">
            <img src="https://dl.dropboxusercontent.com/scl/fi/c1guzvafesv6wvks5arlq/pexels-junior-teixeira-2072060-2.avif?rlkey=gjy8no4a8btig3lthdg7huskq&dl=0" alt="Ulevus Logo" className="logo-image" />
            <h1>3432 W. Diversey Ave. Floor 2 Chicago, IL 60647</h1>
            <p>info@ulevus.com <br/> +1 312-761-5993</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
