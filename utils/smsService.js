import FormData from "form-data";
import Mailgun from "mailgun.js";
import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";

async function sendSimpleMessage(email, name, code) {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.API_KEY || "API_KEY",
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
  try {
    const data = await mg.messages.create("carehubex.com", {
      from: "Carehub Exhange <postmaster@carehubex.com>",
      to: [`${name} <${email}>`],
      subject: 'Verify Your Email',
      text: `Your Carehub verification code is ${code}`,
      html: VERIFICATION_EMAIL_TEMPLATE
      .replace('fullName', name)
      .replace('verificationCode', code)
    });
    
  } catch (error) {
    console.log(error);
  }
}

export default sendSimpleMessage


// import axios from 'axios';
 
// const sendSMS = async (toPhoneNumber, message) => {
//   try {
 
//     const response = await axios.post('https://v3.api.termii.com/api/sms/send', {
//       to: toPhoneNumber,
//       from: "TradingPLT",
//       sms: message,
//       type: "plain",
//       channel: "generic", 
//       api_key: process.env.TERMII_API_KEY,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Failed to send SMS:', error.response?.data || error.message);
//     throw error; 
//   }
// };
 
// // const formatPhoneNumber = (phoneNumber) => {
// //     if (phoneNumber.startsWith('+')) {
// //       return phoneNumber;
// //     }
  
// //     if (phoneNumber.startsWith('0')) {
// //       return '+234' + phoneNumber.slice(1);
// //     }
  
// //     return phoneNumber;
// //   };
 
// export default sendSMS;
 