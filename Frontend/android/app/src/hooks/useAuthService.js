import { Alert } from 'react-native';
import axiosInstance from '../api/axiosInstance'

const useAuthService = () => {

  const loginUser = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email: email.trim(),
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      
      const data = response.data;
      const { token } = data;

      return {
        success: true,
        token,
        data,
        message: 'Login successful'
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid Credentials';
      
      return {
        success: false,
        message,
        error
      };
    }
  };


const registerUser = async (email, password) => {
    try {
        const response = await axiosInstance.post('/api/auth/register', {
            email,
            password,
        });

        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Error during registration.';
        throw new Error(message);
    }
};

const createProfile = async (token, userData) => {
    const { fullName, cnic, dob, gender, address, contactNo, profilePic } = userData;
    
    const formData = new FormData();
    formData.append('username', fullName);
    formData.append('cnic', cnic);
    formData.append('dob', dob);
    formData.append('gender', gender);
    formData.append('address', address);
    formData.append('contactNo', contactNo);

    if (profilePic) {
        const fileName = profilePic.split('/').pop();
        const fileType = fileName.split('.').pop();
        formData.append('file', {
            uri: profilePic,
            name: fileName,
            type: `image/${fileType}`,
        });
    }

    try {
        const response = await axiosInstance.post(
            '/api/profile/createProfile',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || 'Error creating profile.';
        throw new Error(message);
    }
};

  return { loginUser, registerUser, createProfile };
};

export default useAuthService;
