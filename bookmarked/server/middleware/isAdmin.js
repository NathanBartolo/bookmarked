// Admin Middleware
// protects sensitive routes by verifying the user credentials and permissions

const isAdmin = (req, res, next) => {
  // verifies if a valid session exists through passport
  if (req.isAuthenticated()) {
    
    // checks the role field in the user document to confirm privileges
    if (req.user.role === 'admin') {
      // grants access to the next function in the route chain
      return next(); 
    } else {
      // returns a 403 forbidden error if the user is not an Admin
      res.status(403).json({ message: "Access Denied: You are not an Admin!" });
    }

  } else {
    // returns a 401 unauthorized error if no user is logged in
    res.status(401).json({ message: "Please log in first." });
  }
};

module.exports = isAdmin;