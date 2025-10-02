const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Verify Google ID token
async function verifyIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error('Invalid ID token');
  }
}

// Google Sign-In authentication
const googleAuth = async (req, res) => {
  const { idToken, redirectUrl } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing idToken' 
    });
  }

  try {
    // Verify the Google ID token
    const payload = await verifyIdToken(idToken);
    const { sub: googleSub, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ googleSub });
    
    if (!user) {
      // Create new user
      user = new User({ 
        googleSub, 
        email, 
        name,
        picture,
        lastLogin: new Date()
      });
      await user.save();
      
      const response = { 
        success: true,
        status: 'new', 
        user,
        message: 'New user created successfully'
      };

      // Add redirect URL if provided
      if (redirectUrl) {
        response.redirectUrl = redirectUrl;
      }
      
      return res.json(response);
    } else {
      // Update last login for existing user
      user.lastLogin = new Date();
      await user.save();
      
      const response = { 
        success: true,
        status: 'existing', 
        user,
        message: 'User logged in successfully'
      };

      // Add redirect URL if provided
      if (redirectUrl) {
        response.redirectUrl = redirectUrl;
      }
      
      return res.json(response);
    }
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid ID token or authentication failed' 
    });
  }
};

// Update user business information
const updateBusinessInfo = async (req, res) => {
  const { 
    googleSub, 
    businessName, 
    ownerName, 
    businessNumber, 
    address, 
    city, 
    zip, 
    phone 
  } = req.body;

  // Validate required fields
  if (!googleSub || !businessName || !ownerName || !businessNumber || 
      !address || !city || !zip || !phone) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required business fields' 
    });
  }

  try {
    const user = await User.findOne({ googleSub });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update business information
    user.businessCompleted = true;
    user.business = { 
      businessName, 
      ownerName, 
      businessNumber, 
      address, 
      city, 
      zip, 
      phone 
    };
    
    await user.save();

    return res.json({ 
      success: true,
      user,
      message: 'Business information updated successfully' 
    });
  } catch (error) {
    console.error('Business update error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error while updating business information' 
    });
  }
};

// Get user by Google Sub
const getUserByGoogleSub = async (req, res) => {
  const { googleSub } = req.params;

  try {
    const user = await User.findOne({ googleSub });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    return res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user' 
    });
  }
};

module.exports = {
  googleAuth,
  updateBusinessInfo,
  getUserByGoogleSub
};
