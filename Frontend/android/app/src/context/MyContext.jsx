import React, { createContext, useState } from "react";

// Create the context
export const MyContext = createContext(undefined);

// Create a provider component
const MyProvider = ({ children }) => {
  const [capsuleInfo, setCapsuleInfo] = useState({
    title: "",
    description: "",
    unlockDate: "",
    capsuleType: "",
    fileUri: "",
  });
  const [token, setToken] = useState("");
  const [userDetails, setUserDetails] = useState({
    profilePicture: "",
    username: "",
    bio: "",
    contactNo: "",
    cnic: "",
    dob: "",
    gender:"",
    address:"",
  });

  return (
<MyContext.Provider value={{ userDetails, setUserDetails, capsuleInfo, setCapsuleInfo, token, setToken }}>
      {children}
  </MyContext.Provider>
  );
};

export default MyProvider;
