import axios from 'axios';
 
const sendSMS = async (toPhoneNumber, message) => {
  try {
    const formattedPhoneNumber = formatPhoneNumber(toPhoneNumber);
 
    const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
      to: formattedPhoneNumber,
      from: "Termii",
      sms: message,
      type: "plain",
      channel: "generic", 
      api_key: process.env.TERMII_API_KEY,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send SMS:', error.response?.data || error.message);
    throw error; 
  }
};
 
const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
  
    if (phoneNumber.startsWith('0')) {
      return '+234' + phoneNumber.slice(1);
    }
  
    return phoneNumber;
  };
 
export default sendSMS;
 