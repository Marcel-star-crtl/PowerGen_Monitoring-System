// import React, { useState } from 'react';
// import './newsLetter.css';

// const NewsLetter = () => {
//   const [email, setEmail] = useState('');

  // const handleSubscribe = (e) => {
  //   e.preventDefault();
  //   // TODO: Add logic to handle the subscription (e.g., send the email to your backend)
  //   console.log('Subscribed with email:', email);
  //   // You can clear the input field after subscription if needed
  //   setEmail('');
  // };

//   return (
//     <div className="newsletter">
//       <form onSubmit={handleSubscribe} className="subscribe-form">
//         <label htmlFor="email">Subscribe to our Newsletter:</label>
//         <div className="form-group">
//           <input
//             type="email"
//             id="email"
//             name="email"
//             placeholder="Your Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//           <button type="submit">Subscribe</button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default NewsLetter;






// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as Yup from 'yup';
// import './newsLetter.css';
// import axios from 'axios';
// import { database } from '../../firebaseConfig';
// import { collection, doc, setDoc } from 'firebase/firestore';  

// const NewsLetter = () => {
//   const validationSchema = Yup.object().shape({
//     email: Yup.string().email('Invalid email format').required('Email is required'),
//   });

//   const {
//     register,
//     handleSubmit,
//     formState: { errors: formErrors, isSubmitting },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//   });

//   const handleSubscribe = async (data) => {
//     // Check if there is input before submitting
//     if (!data.email) {
//       // Handle the case when there is no input
//       return;
//     }

//     try {
//       // Save the email to Firestore using direct import of collection, doc, and setDoc
//       const newSubscriberRef = doc(collection(database, 'newsletterSubscribers'));
//       await setDoc(newSubscriberRef, { email: data.email });

//       console.log('Subscription successful. Subscriber:', {
//         id: newSubscriberRef.id,
//         email: data.email,
//       });
//       console.log('Subscription successful');
//     } catch (error) {
//       // Handle the error, display a failure message, or take appropriate action
//       console.error('Error subscribing:', error);
//     }
//   };

//   return (
//     <div className="newsletter">
//       <form onSubmit={handleSubmit(handleSubscribe)} className="subscribe-form">
//         <label htmlFor="email">Subscribe to our Newsletter:</label>
//         <div className="form-group">
//           <input
//             type="email"
//             id="email"
//             name="email"
//             placeholder="Your Email"
//             {...register('email')}
//           />
//           <button type="submit" disabled={isSubmitting}>
//             {isSubmitting ? 'Subscribing...' : 'Subscribe'}
//           </button>
//         </div>
//         {formErrors.email && <p className="error-message">{formErrors.email.message}</p>}
//       </form>
//     </div>
//   );
// };

// export default NewsLetter;




// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as Yup from 'yup';
// import './newsLetter.css';
// import { database } from '../../firebaseConfig';
// import { collection, doc, setDoc } from 'firebase/firestore';
// import axios from 'axios';
// import md5 from 'md5';

// const NewsLetter = () => {
//   const validationSchema = Yup.object().shape({
//     email: Yup.string().email('Invalid email format').required('Email is required'),
//   });

//   const {
//     register,
//     handleSubmit,
//     formState: { errors: formErrors, isSubmitting },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//   });

//   const addSubscriberToMailchimp = async (email) => {
//     try {
//       const subscriberHash = md5(email);

//       const apiKey = process.env.GATSBY_MAILCHIMP_API_KEY;
//       const listId = "7504854731";
//       const proxyUrl = 'https://ulevusproxy-623eb395a8bb.herokuapp.com/';
//       const endpoint = `${proxyUrl}https://us12.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

//       const response = await axios.put(
//         endpoint,
//         {
//           email_address: email,
//           status: "pending",
//           tags: ["OFT Newsletter"], 
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `apikey ${apiKey}`,
//           },
//         }
//       );

//       console.log('Subscription successful. Mailchimp response:', response.data);
//     } catch (error) {
//       console.error('Error subscribing to Mailchimp:', error.response ? error.response.data : error.message);
//     }
//   };

//   const handleSubscribe = async (data) => {
//     if (!data.email) {
//       return;
//     }

//     try {
//       // Save the email to Firestore
//       const newSubscriberRef = doc(collection(database, 'newsletterSubscribers'));
//       await setDoc(newSubscriberRef, { email: data.email });

//       // Add the subscriber to Mailchimp
//       await addSubscriberToMailchimp(data.email);

//       console.log('Subscription successful. Subscriber:', {
//         id: newSubscriberRef.id,
//         email: data.email,
//       });
//       console.log('Subscription successful');
//     } catch (error) {
//       console.error('Error subscribing:', error);
//     }
//   };

//   return (
//     <div className="newsletter">
//       <form onSubmit={handleSubmit(handleSubscribe)} className="subscribe-form">
//         <label htmlFor="email">Subscribe to our Newsletter:</label>
//         <div className="form-group">
//           <input
//             type="email"
//             id="email"
//             name="email"
//             placeholder="Your Email"
//             {...register('email')}
//           />
//           <button type="submit" disabled={isSubmitting}>
//             {isSubmitting ? 'Subscribing...' : 'Subscribe'}
//           </button>
//         </div>
//         {formErrors.email && <p className="error-message">{formErrors.email.message}</p>}
//       </form>
//     </div>
//   );
// };

// export default NewsLetter;
