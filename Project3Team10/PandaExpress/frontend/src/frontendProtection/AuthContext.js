import { useContext, createContext, useState, useEffect } from "react";
import axios from 'axios';

const AuthContext = createContext();

// const AuthProvider = ({ children }) => {
//   return <AuthContext.Provider>{children}</AuthContext.Provider>;
// };

const API_URL = 'http://localhost:5000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if(context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const  checkUserStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/user/status`, {withCredentials: true,});
      console.log("Checking");
      if(response.data.isAuthenticated) {
        console.log("Is authenticated");
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
      else {
        console.log("Not authenticated fetched");
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    }
    finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${API_URL}/api/logout`);
      setUser(null);
      setIsAuthenticated(false);
    }
    catch(err) {
      console.error('Logout was unsuccessful', err)
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    logout
  };

  return (<AuthContext.Provider value={contextValue}>
    {children}
    </AuthContext.Provider>
    );
}
// export default AuthProvider;