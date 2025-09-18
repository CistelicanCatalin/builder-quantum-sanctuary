import express from 'express';
import session from 'express-session';

const router = express.Router();

// Session configuration (should be configured in main app)
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Auth middleware to check if user is authenticated
export const requireAuth = (req: any, res: any, next: any) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Login route
router.post('/login', (req: any, res: any) => {
  const { username, password } = req.body;
  
  // Get credentials from environment variables
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUsername && password === adminPassword) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    
    res.json({
      success: true,
      username: username,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Logout route
router.post('/logout', (req: any, res: any) => {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Check authentication status
router.get('/check', (req: any, res: any) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({
      isAuthenticated: true,
      username: req.session.username
    });
  } else {
    res.status(401).json({
      isAuthenticated: false
    });
  }
});

export const authRouter = router;