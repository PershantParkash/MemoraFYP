
import axios from 'axios';
import Config from 'react-native-config';
const axiosInstance = axios.create({
  baseURL: Config.API_BASE_URL, 
});

export default axiosInstance;
// import axios from 'axios';

// const axiosInstance = axios.create({
//   baseURL: 'http://192.168.1.37:5000', 
// });

// export default axiosInstance;
