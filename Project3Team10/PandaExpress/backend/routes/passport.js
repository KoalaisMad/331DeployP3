// passport.js
import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
import pool from "../db.js"
import passport from 'passport';
import {Strategy as GoogleStrategy} from 'passport-google-oauth2';


passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback",
        passReqToCallback   : true
},
async function(request, accessToken, refreshToken, profile, done) {
        // When done, go to profile
        // Save to database
        // First check if email exists in the database

        const email = profile.emails[0].value;
        const existRow = await pool.query("SELECT * FROM employees WHERE google_id=$1", [profile.id]);

        if(existRow.rowCount > 0) {
            // Get first row
            const user = existRow.rows[0];
            // Authenticate roles other than None
            if(user.role && user.role.toLowerCase() !== 'none') {
                 console.log("User authenticated!");
                 return done(null, user);
            }
            else {
                console.log("Failed to authenticate -> customer");
                return done(null, false,{message: "Failed to authenticate, defaulting to customer view"});
            } 
        }
        else { 
            // User does not exist
            // Assign new users, by default, role of customer pending

            const defaultRole = 'None';
            const newUser = await pool.query("INSERT INTO employees (name, role, google_id, email) VALUES ($1, $2, $3, $4) RETURNING *", [profile.displayName, defaultRole, profile.id, email]);
            console.log("New user created with default 'Customer' role. Manager needs to change access if needed.");

            return done(null, profile);
        }
}
));

// Session management

// Save user's data inside session
passport.serializeUser(function(user, done) {
    done(null, user);
});

// Retrieve user's data when needed
passport.deserializeUser(function(user, done) {
    done(null, user);
});