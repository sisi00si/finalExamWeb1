// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    age: String,
    country: String,
    gender: String
});

const User = mongoose.model('User', userSchema, 'user'); // 'user' is the collection name

module.exports = User;
