import { failure } from './response.js';

const catchAsync = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        console.error('❌ Error in async function:', error);
        failure(res, 'Something went wrong. Please try again later.');
      }
    };
};
  
export default catchAsync