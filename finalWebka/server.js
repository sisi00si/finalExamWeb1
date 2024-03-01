//server.js

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const initializePassport = require("./passport-config");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require('mongoose');



const User = require('./models/user');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://su:lab123456@lab1.she7d5c.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log("Connected to MongoDB");
});

const app = express();

initializePassport(
  passport,
  async (username) => await User.findOne({ username: username }),
  async (id) => await User.findById(id)
);

app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.post("/login", checkNotAuthenticated, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (!user) {
          // Incorrect username or password
          req.flash('error', 'Incorrect username or password');
          res.render("login.ejs", { messages: req.flash() }); // Pass flash messages to the template
          return;
      }

      req.logIn(user, (err) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }

          // Successful login
         return res.redirect('/home');
      });
  })(req, res, next);
  
});





app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
  
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      const newUser = new User({
          username: req.body.username,
          password: hashedPassword,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          age: req.body.age,
          country: req.body.country,
          gender: req.body.gender
      });
      
      await newUser.save();
      res.redirect('/login');
  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
        req.flash('error', 'Username already exists');
    } else {
        req.flash('error', 'An error occurred during registration');
    }
    res.redirect('/register');
  }
});


//countries
const CountryList = require("country-list");
const countries = CountryList.getData().map(country => {
    return {
        code: country.code,
        name: country.name
    };
});

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render("register.ejs", { countries: countries, errorMessage: req.flash('error') });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get('/home', checkNotAuthenticated, (req, res) => {
  res.render("home.ejs");
});

app.delete("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});


function checkNotAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return res.redirect("/");
  }
  next();
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
