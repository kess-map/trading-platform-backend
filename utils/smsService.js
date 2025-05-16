import axios from 'axios';
 
const sendSMS = async (toPhoneNumber, message) => {
  try {
 
    const response = await axios.post('https://v3.api.termii.com/api/sms/send', {
      to: toPhoneNumber,
      from: "TradingPLT",
      sms: message,
      type: "plain",
      channel: "generic", 
      api_key: process.env.TERMII_API_KEY,
    });
    console.log(response)
    return response.data;
  } catch (error) {
    console.error('Failed to send SMS:', error.response?.data || error.message);
    throw error; 
  }
};
 
// const formatPhoneNumber = (phoneNumber) => {
//     if (phoneNumber.startsWith('+')) {
//       return phoneNumber;
//     }
  
//     if (phoneNumber.startsWith('0')) {
//       return '+234' + phoneNumber.slice(1);
//     }
  
//     return phoneNumber;
//   };
 
export default sendSMS;
 