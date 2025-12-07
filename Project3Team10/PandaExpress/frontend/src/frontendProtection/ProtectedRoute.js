import Manager from '../ManagerView/Manager';
import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from './AuthContext';

const ProtectedRoute = ({children, allowedRoles}) => {
    const {user, isAuthenticated, isLoading} = useAuth();
    const location = useLocation();

    if(isLoading) {
        return <div>Loading session...</div>;
    }

    // Check for authentication: If not authenticated (unauthenticated user), redirect the user to home page
    if(!isAuthenticated) {
        console.log("Navigating back");
        return <Navigate to="/unauthorized" replace state={{from: location}} />;
    }

    // Check for authorization: If user has invalid role
    if(!user || !user.role || !allowedRoles.includes(user.role.toLowerCase())) {
        console.log("Navigating to unauthorized");
        return <Navigate to="/unauthorized" replace />;
    }

    // If everything is fine, render component
    return children;

}

export default ProtectedRoute;