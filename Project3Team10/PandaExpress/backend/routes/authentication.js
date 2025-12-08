import express from "express";
import pool from "../db.js";

const router = express.Router();
import passport from 'passport'

// In production, frontend is served from same origin, so use relative paths
const FRONTEND_ORIGIN = process.env.NODE_ENV === 'production' ? '' : (process.env.FRONTEND_URL || 'http://localhost:3000');
// router.get("/", (req, res) => {
//     res.send("<a href='/auth/google>Login with Google</a>");
// });

// Middleware for protecting backend API endpoints from unauthorized access
function protectAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({message: 'Unauthorized access'});
}

// Middleware for checking for authorized role specifically
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).send('Unauthorized user. Login is required.')
        }

        // Get user role
        const userRole = req.user.role ? req.user.role : '';

        // Verify if user is within authorized access scope
        if(allowedRoles.includes(userRole)) {
            next(); // Continue access to route
        }
        else{
            res.status(403).send('Invalid access; permission to view page is denied.')
        }
    }
}

// Needed to get inforamtion about view
router.get("/auth/google/start", (req, res, next) => {
    // const {view} = req.query;
    const view = req.query.view ? req.query.view.toLowerCase(): 'none';
    const validView = (view === 'manager' || view === 'cashier') ? view: 'unauthorized';

    console.log("View", view);

    // Store intended view in session so it can be retrieved in callback
    req.session.intendedView = validView;
    req.session.save((err) => {
        if (err) {
            console.error('Session save error during start:', err);
            return res.redirect(`${FRONTEND_ORIGIN}/unauthorized`);
        }
        passport.authenticate("google", {scope: ["profile", "email"], prompt: 'select_account'})(req, res, next);
    });
});

router.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile", "email"], prompt: 'select_account'}));
    // Add: // prompt: 'selected_account' // to the end if want to bring back login screen 

// If authentication is not successful, goes back to home page. If successful, go to profile route
router.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: `${FRONTEND_ORIGIN}/unauthorized`}), (req, res) => {
    // res.redirect('http://localhost:3000/profile');
    let redirectUrl = `${FRONTEND_ORIGIN}/unauthorized`;

    // Obtain view from session (not from query string)
    const intendedView = req.session.intendedView;
    const userRole = req.user && req.user.role ? req.user.role.toLowerCase().trim() : '';
    
    console.log('=== OAuth Callback Debug ===');
    console.log('Intended View:', intendedView);
    console.log('User Role:', userRole);
    console.log('User object:', JSON.stringify(req.user, null, 2));
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    
    if(intendedView === 'manager' && userRole === 'manager') {
        redirectUrl = `${FRONTEND_ORIGIN}/manager`;
    }
    else if(intendedView === 'cashier' && (userRole === 'employee' || userRole === 'manager')) {
        redirectUrl = `${FRONTEND_ORIGIN}/cashier`;
    }
    console.log('Redirect URL:', redirectUrl);
    console.log('=== End OAuth Callback Debug ===');

    // Save session before redirect to ensure it persists
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.redirect(`${FRONTEND_ORIGIN}/unauthorized`);
        }
        // Clean up cookie data
        delete req.session.intendedView;
        res.redirect(redirectUrl);
    });
});

// For debugging
router.get("/profile", protectAuthenticated, async (req, res) => {
    res.send(`Welcome ${req.user.displayName}`);
});

router.get("/logout", (req, res) => {
    // Clear cookie -> deletes small data that website stored on computer; but does not sign user out of Google account
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        res.clearCookie('connect.sid', {path: '/', secure: false, httpOnly: false});
        // Note: Don't redirect because this is fetch
        res.status(200).json({message: "Log out successful!"});
    });
});

router.get("/api/user/status", protectAuthenticated, (req, res) => {
    console.log("Successful"); 
    res.status(200).json({isAuthenticated: true, user: req.user});
});

export default router;
