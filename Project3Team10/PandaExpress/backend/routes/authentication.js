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

    passport.authenticate("google", {scope: ["profile", "email"], prompt: 'select_account', state: validView})(req, res, next);
});

router.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile", "email"], prompt: 'select_account'}));
    // Add: // prompt: 'selected_account' // to the end if want to bring back login screen 

// If authentication is not successful, goes back to home page. If successful, redirect to requested view
router.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: `${FRONTEND_ORIGIN}/unauthorized`}), (req, res) => {
    console.log('=== OAuth Callback Debug ===');
    console.log('User authenticated:', req.isAuthenticated());
    console.log('User object:', JSON.stringify(req.user, null, 2));
    console.log('User role:', req.user?.role);
    console.log('Session ID:', req.sessionID);
    console.log('=== End OAuth Callback Debug ===');
    
    // Get requested view from state parameter
    const state = req.query.state || 'manager';
    const redirectPath = (state === 'cashier') ? '/cashier' : '/manager';
    
    res.redirect(`${FRONTEND_ORIGIN}${redirectPath}`);
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