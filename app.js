//jshint esversion:6
require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const date = require(__dirname + "/date.js");
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require("passport"); //, LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy

const homeStartingContent = "Welcome to your Daily Journal!";
const app = express();
const _ = require('lodash');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
//////////////////////////////////////////////////////Database

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {  //"mongodb://localhost:27017/userDB"
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

/////////////////POST
const postSchema = {
  postTitle: String,
  postBody: String,
  date: String,
  userId: String,
}

const Post = mongoose.model('Post', postSchema);

/////////////////USER
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required : true
  },
  googleId: {
    type: String,
  },
  facebookId: {
    type: String,
  },
  password: {
    type: String,
    required : true
  },
  date: {
    type: Date,
    default: Date.now,
  },
  authorName: {
    type: Object,
  },
  post: {
    type: String,
    required : true
  }
});

userSchema.plugin(passportLocalMongoose, {
  selectFields: ' username password googleId facebookId date authorName'
});
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/dashboard",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'

},
 function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate(
    { 
      googleId: profile.id,
      username: profile.emails[0].value,
      authorName: profile.name,
     }, 
     function (err, user) {
    return cb(err, user);
  }
  );
}
));

const navArr = [];
//////////////////////////////////////////////////////////Get social

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

app.get('/auth/google/dailyjournal', //HIGHLIGHT : changed
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

///
app.get('/auth/facebook',
  passport.authenticate('facebook') //, { scope: ['profile'] })
);

app.get('/auth/facebook/dailyjournal', //HIGHLIGHT : changed
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });



//////////////////////////////////////////////////////////Get


app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    navArr.push({ item: "LOG OUT" });
    res.redirect("/dashboard");
  } else {
    res.render("home", { navArr });
  }
});
app.get("/register", (req, res) =>{
  res.render("register", { navArr } );
});

app.get('/about', (req, res) => {
  if (req.isAuthenticated()) {
    navArr.push({ item: "LOG OUT" });
  }
  res.render('about', { navArr });
})

app.get('/login', (req, res) => {
  res.render('login', { navArr });
})

app.get("/logout", function (req, res) {
  req.logout();
 
  res.redirect("/login");
});
  
app.get('/post/:postId', (req, res) => {
  const requestedPostId = req.params.postId;

  Post.findOne({
    _id: requestedPostId
  }, function(err, post) {
    /*posts.forEach(function(post) {
      const storedTitle = _.lowerCase(post.postId);

      if (storedTitle === requestedPostId) {
        res.render('post', {
          postTitle: post.postTitle,
          postBody: post.postBody
          */
    res.render('post', {
      postTitle: post.postTitle,
      postBody: post.postBody,
      date:post.date,
      post,
      navArr
    });
  });
})


app.get('/dashboard', (req, res) => {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          navArr.push({ item: "LOG OUT" });
          Post.find({ userId: foundUser._id })
           .collation({ locale: "en" })
            .sort({ date: -1 })
            .exec(function (err, posts) {
              res.render("dashboard", {
                posts: posts,
                startingContent: homeStartingContent,
                navArr
                });
              });
            }
          }
        });
      } else {
        res.redirect("/");   //HIGHLIGHT : changed 
      }
    });


app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    navArr.push({ item: "LOG OUT" });
    res.render("compose", { navArr });
  } else {
    res.redirect("/login");
  }
});


/////////////////////////////////////////////////////////////Post

app.post('/compose', (req, res) => {
  const time = date.getTime();
  const post = new Post({
    date: time,
    postTitle: req.body.postTitle,
    postBody: req.body.postBody,
    userId:req.user.id
  });
   console.log(req.user.id);
/*
  post.save(function(err) {
    if (!err) {
      res.redirect("/dashboard");
    }
*///find  the cuurent user in our database:
    User.findById(req.user.id, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          post.save(function (err) {
            if (!err) {
              res.redirect("/dashboard");
            }
          });
        }
      }
    });

  });


app.post('/register', (req,res)=>{
  let errors = [];
  User.register({ username: req.body.username }, req.body.password, function(err, user){
    
    if (err) {
      errors.push({ msg: err.message });
      res.render("register", { errors, navArr });
    } else {
      passport.authenticate("local")(req, res,() =>{
        res.redirect("/dashboard");
      });
    }
});
//}
});

app.post("/login", function (req, res) {
  let errors = [];

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) {
      console.log(err);
    } if (!user) {
      errors.push({ msg: "This email has not been registered" });
      res.render("login", { errors, navArr });
    } else {
      req.login(user, function (err) {
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local", { failureRedirect: '/login' })(req, res, function () {
            res.redirect("/dashboard");
          });
        }
      });
    }
  })
}
);

//DELETE
app.post("/delete", function (req, res) {
  const deletedPost = req.body.deletedPost;
  Post.deleteOne({ _id: deletedPost }, function (err) {
    if (!err) {
      res.redirect("/dashboard");
    }
  });
});




////
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})






  //posts.push(post)
  //res.redirect('/')

/*
 const post = {
    postTitle: req.body.postTitle,
    postBody: req.body.postBody
  }
&&&&&&&&&
app.post("/compose", function (req, res) {
  const time = date.getTime();

  const post = new BlogPost({
    date: time,
    title: req.body.postTitle,
    content: req.body.postBody,
    userId: req.user.id,
  });

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        post.save(function (err) {
          if (!err) {
            res.redirect("/");
          }
        });
      }
    }
  });


});
  
*/



/*
app.post("/register", function (req, res) {
  let errors = [];
  if (req.body.password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, navArr });
  } else {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
      if (err) {
        errors.push({ msg: err.message });
        res.render("register", { errors, navArr });
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/userhome");
        });
      }
    });
  }
});

*/


/*
app.get('/dashboard', (req, res) => {
  Post.find({}, function(err, posts){
    res.render("dashboard", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});

Post.find({}, function(err, foundPosts){
    if(err){
      console.log(err);
    }else{
       if(foundPosts){
        res.render("dashboard", {
          startingContent: homeStartingContent,
          posts: posts
          });
       }

    }
  });
  ///////Others 
app.get("/userhome", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          navArr.push({ item: "LOG OUT" });
          BlogPost.find({ userId: foundUser._id })
            .collation({ locale: "en" })
            .sort({ date: -1 })
            .exec(function (err, posts) {
              res.render("userHome", { posts, navArr });
            });
        }
      }
    });
  } else {
    res.redirect("/");
  }
});

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
           Post.find({ userId: foundUser._id })
            .collation({ locale: "en" })
            .sort({ date: -1 })
            .exec(function (err, posts) {
              res.render("dashboard", {posts});
            });
        }
      }
    });
  } else {
    res.redirect("/dashboard");
  }

&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
let navArr = [];

app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    navArr.push({ item: "LOG OUT" });
    res.redirect("/");
  } else {
    res.render("/", { navArr });
  }
});

/*
  if(req.isAuthenticated()){
    Post.find({
      'post': {
        $ne: null
      }
    }, function(err, foundPosts) {
      if (err) {
        console.log(err)
      } else {
        if (foundPosts) {
          res.render('dashboard', {
            usersWithSecrets: foundPosts
          })
        }
      }
    })
  } 
})
app.get("/register", function (req, res) {
  res.render("register", { navArr });
});

app.get('/compose', (req, res) => {
  res.render('compose')
})

*/


/*
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
*/