export const success = (res, data, message = 'success', status = 200, ) =>{
    res.status(status).json({ success: true, data, message });
}
  
export const failure = (res, message = 'Something went wrong', status = 500) =>{
    res.status(status).json({ success: false, message });
}