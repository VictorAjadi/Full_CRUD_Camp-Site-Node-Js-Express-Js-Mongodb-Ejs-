var express     = require("express"),
    app         = express(),
    request     = require('request'),
    bodyParser  = require("body-parser"),
    methodOverride=require('method-override'),
    expressSanitizer=require('express-sanitizer'),
    passport     =require('passport'),
    localStrategy=require('passport-local'),
    passportLocalMongoose=require('passport-local-mongoose'),
    Campgrounds = require('./models/campground'),  //campground Schema Setup
    comment     = require('./models/comment'),
    flash       = require('connect-flash'),
    user      = require('./models/user')
        //seedDB      = require('./seeds'),

var mongoose = require('mongoose');
//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/yelp_camp';
mongoose.connect(mongoDB, { useNewUrlParser: true });
 //Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
//seedDB();

//============
//Passport Configuration
//============
app.use(require('express-session')({
  secret: 'i really do love oluwapelumi',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
app.use((req,res,next)=>{
  res.locals.userLoggedIn=req.user;
  res.locals.error=req.flash('error');
  res.locals.success=req.flash('success');
  next();
})

app.get("/",function(req,res){
    res.render("landing");
});




//=========
//camping
//========
app.get("/camping",function(req,res){
    //get me all campgrounds from db
    Campgrounds.find()
    .then(findedCampground => {
      // Handle the found campgrounds
      res.render("index",{camping:findedCampground});  
    })
    .catch(error => {
      // Handle the error
      console.error(error);
    });

});

//new campground
app.get("/camping/new",isLoggedIn,function(req,res) {
     res.render("new");
});
//new campGround created
app.post("/camping",isLoggedIn,function(req,res){
  var name=req.body.name;
  var image=req.body.image;
  var description=req.body.description;
  var price=req.body.price;
  var author={
    id: req.user._id,
    username: req.user.username
  };
  var new_data={name: name,price: price,image: image, description: description, author: author}
  //create and save the new campground

Campgrounds.create(new_data)
.then(createdDocument=> {
  //handles the document
  console.log('Successfully created campgrounds');
   res.redirect("/camping");
})
.catch(error=>{
  //handles the error
  console.error(error);
  res.render("new");
});

});


//=============
//show route
//=============
app.get("/camping/:id",isLoggedIn,function(req,res){
  // Check if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.send('Invalid ObjectId');
    return;
  };
//populate() is to convert the id data of comment to array of strings
  Campgrounds.findById(req.params.id).populate('comment').exec()
    .then(document => {
        // Handle the found campgrounds
            res.render("show", { camping: document });
      })
      .catch(error => {
        // Handle the error
            console.error(error);
      });

});




//==============
//comment route
//==============
app.get('/camping/:id/comments/new',isLoggedIn,(req,res)=>{
  //find by id
  Campgrounds.findById(req.params.id)
  .then(campground=>{
    res.render('comment',{camping: campground})
  })
  .catch(error=>{
    console.error(error);
  });
})
//========================
//creating comment route
//========================
app.post('/camping/:id/comments',isLoggedIn,(req,res)=>{
  Campgrounds.findById(req.params.id)
  .then(campground=>{  
    //creating new comment 
    comment.create(req.body)
     .then(newComment=>{
      //add username + comment 
      newComment.author.id = req.user._id;
      newComment.author.username=req.user.username;
      newComment.save();
      campground.comment.push(newComment);
      campground.save()
      .then(newCampground=>{
        req.flash('success','Successfully added comment');
        res.redirect('/camping/' + newCampground._id);
      })
      .catch(error=>{
        console.error(error);
      });
     })
     .catch(error=>{
      console.error(error);
     });
      })
  .catch(error=>{
    console.error(error);
  });
});



//================
//campground Edit route
//================
app.get('/camping/:id/edit',checkOwnerShip,(req,res)=>{
  Campgrounds.findById(req.params.id)
  .then(campground=>{
    res.render('edit',{camping: campground});
  })
  .catch(error=>{
    console.error(error);
    res.redirect('/camping');
  });
});
//========================
//campground Update route
//========================
app.put('/camping/:id',checkOwnerShip,(req,res)=>{
  Campgrounds.findByIdAndUpdate(req.params.id,req.body)
  .then(campground=>{
     res.redirect('/camping/' + campground._id);
  })
  .catch(error=>{
    console.error(error);
  });
});
//===============
//campground delete route
//===============
app.delete('/camping/:id',checkOwnerShip,(req,res)=>{
  Campgrounds.findByIdAndRemove(req.params.id,req.body)
  .then(campground=>{
     res.redirect('/camping');
  })
  .catch(error=>{
     console.error(error);
  });
});


//===================
//comment edit route
//===================
app.get('/camping/:id/comment/:comment_id/edit',checkCommentOwnership,(req,res)=>{
      comment.findById(req.params.comment_id)
      .then(comment=>{
          res.render('commentEdit',{camping_id: req.params.id, comment: comment});
      })
      .catch(error=>{
           console.error(error);
      });
});
//==================== 
//comment update route
//=====================
app.put('/camping/:id/comment/:comment_id/edit',checkCommentOwnership,(req,res)=>{
    comment.findByIdAndUpdate(req.params.comment_id,req.body)
    .then(comment=>{
      req.flash('success','Your comment has been updated');
        res.redirect('/camping/' + req.params.id);
    })
    .catch(error=>{
         console.error(error);
         res.redirect('back');
    });
});
//======================
//comment delete route
//======================
app.delete('/camping/:id/comment/:comment_id/edit',checkCommentOwnership,(req,res)=>{
    comment.findByIdAndRemove(req.params.comment_id,req.body)
    .then(comment=>{
      req.flash('success','Comment Deleted');
        res.redirect('/camping/' + req.params.id);
    })
    .catch(error=>{
     console.error(error);
    });
});


//===========
//Register route
//===========
app.get('/register',(req,res)=>{
   res.render('register');
});
app.post('/register',(req,res)=>{
    var newUser = new user({username: req.body.username})
    var password=req.body.password;
    user.register(newUser,password)
    .then(user=>{
      req.flash('success','Welcome to yelpCamp ' + user.username);
      res.redirect('/camping');
    })
    .catch(error=>{
      console.error(error);
      req.flash('error',error.message);
      res.redirect('/register');
    });
});



//===========
//Login Route
//===========
app.get('/login',(req,res)=>{
    res.render('login');
});
app.post('/login',passport.authenticate('local',{
  successRedirect: '/camping',
  failureRedirect: '/login'
}),(req,res)=>{

});



//=============
//Logout Route
//=============
app.get('/logout',(req,res)=>{
  req.logout(req.user, err =>{
    if (err){
       return next(err);
    }
    req.flash('success','Just Logged Out');
    res.redirect('/camping');
  });
});



//middleware
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
   return next();
  }
  //else the person is not logged in goto login page
  req.flash('error', 'You need to be logged in,login/sign up......');
  res.redirect('/login');
};


function checkOwnerShip(req,res,next){
  if(req.isAuthenticated()){
    Campgrounds.findById(req.params.id)
    .then(campground=>{
      if(campground.author.id.equals(req.user._id)){
        next();
      }else{
        req.flash('error','You Do Not Have Access To Do This')
        res.redirect('back');
      }
    })
    .catch(error=>{
      console.error(error);
      req.flash('error','Can not fetch page');
      res.redirect('/camping');
    });
  }
  else{
    res.redirect('back');
  };
};

function checkCommentOwnership(req,res,next){
  if(req.isAuthenticated){
    comment.findById(req.params.comment_id)
    .then(comment=>{
      if(comment.author.id.equals(req.user._id)){
        next();
      }
      else{
        req.flash('error','You don not have permission to do that');
        res.redirect('back');
      }
    })
    .catch(error=>{
         console.error(error);
    });
  }
  else{
    req.flash('error', 'You need to be logged in,login/sign Up......');
    res.redirect('back');
  }
};


app.listen("3000",function(){
    console.log("The YelpCamp server has started...");
});
