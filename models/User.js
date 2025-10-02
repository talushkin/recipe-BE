const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleSub: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  name: String,
  picture: String,
  businessCompleted: { 
    type: Boolean, 
    default: false 
  },
  business: {
    businessName: String,
    ownerName: String,
    businessNumber: String,
    address: String,
    city: String,
    zip: String,
    phone: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
