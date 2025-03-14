const mongoose = require('mongoose');
const config = require('dotenv').config();

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI ||'mongodb://localhost:27017/mydb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;