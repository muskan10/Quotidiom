require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const passport = require("passport");
const session = require('express-session');
const connectEnsureLogin = require('connect-ensure-login');
const passportLocalMongoose = require("passport-local-mongoose");
var Schema = mongoose.Schema;
var Dictionary = require("oxford-dictionary");
const randomWord = require('random-word')
var moment = require('moment')
var format = 'HH:mm:ss';
const https = require("https");

var config = {
    app_id: process.env.APP_ID,
    app_key: process.env.APP_KEY,
    source_lang: "en-us"
};
var dict = new Dictionary(config);

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(session({
    secret: "This is not a secret",
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://mongodb:27017/quotidiom", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

var UserSchema = new Schema({  
    username : {
        type: String, 
        unique: true, 
        required:true
    },
    userpassword :{
        type: String
    },
    learntWords: {
        type: Array,
        default: []
    },
    wordsForaDay:{
        type:Map,
        of:String,
        default: {"cypsela":"A dry single seeded fruit formed from a double ovary of which only one develops into a seed, as in the daisy family."}
    },
    knowledgeCheck:{
        type:Map,
        of:Object,
        default:{ "Hello": ["Greeting","Seek attention ","Introduction"]}
    }
},
{ timestamps : true }
);


// plugin for passport-local-mongoose
UserSchema.plugin(passportLocalMongoose);
const User =new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate()));


var mean = "";
app.get("/", function(req, res){
    var wordtosearch = randomWord();
    if(req.isAuthenticated()){
        res.render("dashboard",{user:req.user})
    }
    else{
        res.render("index",{word:wordtosearch});
    }
})

app.get("/dashboard", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
                if (foundUser) {
                    let todayDate = new Date();
                    todayDate = todayDate.getFullYear()+"-"+todayDate.getMonth()+"-"+todayDate.getDate();
                    let createdDate = foundUser.createdAt;
                    createdDate = createdDate.getFullYear()+"-"+createdDate.getMonth()+"-"+createdDate.getDate();
                    var d1 = Date.parse(todayDate);
                    var d2 = Date.parse(createdDate);
                    if (d1 > d2) {
                        foundUser.wordsForaDay.clear();
                        foundUser.knowledgeCheck.clear();
                        foundUser.createdAt = new Date();
                        foundUser.save();
                    }
                    res.render("dashboard",{user: req.user});    
                }
            }
        });
    }
    else{
        res.redirect("/");
    }
})

app.post("/searchword", function(req, res){
    var wordtosearch = randomWord();
    const url = 'https://api.dictionaryapi.dev/api/v2/entries/en_US/'+req.body.wordtosearch;

            const request = https.request(url, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data = data + chunk.toString();
                });
            
                response.on('end', () => {
                    const budy = JSON.parse(data, null, 4);
                //  const newData = JSON.stringify(body, null, 4);
                if(budy[0]!==undefined){
                        var definition = budy[0].meanings[0].definitions[0].definition;
                        res.render("searchword",{wordtosearch: req.body.wordtosearch, definition:definition, word: wordtosearch});
                }
                else{
                    res.redirect("/");
                }
                });
            })
        
            request.on('error', (error) => {
                console.log('An error', error);
                res.redirect("/");
            });
            request.end() 
})

app.get("/newwords", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
                        var wordtosearch = randomWord();
                        const url = 'https://api.dictionaryapi.dev/api/v2/entries/en_US/'+wordtosearch;

                        const request = https.request(url, (response) => {
                            let data = '';
                            response.on('data', (chunk) => {
                                data = data + chunk.toString();
                            });
                    
                            response.on('end', () => {
                                const budy = JSON.parse(data, null, 4);
                            //  const newData = JSON.stringify(body, null, 4);
                            try{
                                    var defines= budy[0].meanings[0].definitions[0].definition;
                                    // console.log(defines)
                                    console.log(" Whole JSON "+budy[0]);
                                    if(budy[0] != null || budy[0] != undefined){
                                        foundUser.wordsForaDay.set(wordtosearch,defines);
                                        foundUser.save();
                                    }
                            }
                            catch(err){
                                
                            }
                            });
                        })
                    
                        request.on('error', (error) => {
                            console.log('An error', error);
                            res.redirect("/");
                        });
                        request.end() 
                    }
                  res.render("learn",{user:req.user});
            }
          });
    }
})


app.get("/knowledgeCheck", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    res.render("knowlegdeCheck");
})

app.get("/knowledgeCheck1", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    res.render("kC1",{user: req.user});
})
app.get("/knowledgeCheck2", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    res.render("kC2",{user: req.user});
})

app.get("/knowledgeCheck3", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    res.render("kC3",{user: req.user});
})

app.post("/kC1Submit", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
                if (foundUser) {
                    let arr = [];
                    var w = req.body.word;
                    arr.push(foundUser.wordsForaDay.get(w));
                    arr.push(req.body.meaning1);
                    foundUser.knowledgeCheck.set(req.body.word, arr);  
                    foundUser.save();     
                }
            }
        });
    }
})

app.post("/kC2Submit", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
                if (foundUser) {
                    var arr = foundUser.knowledgeCheck.get(req.body.word);  
                    if(arr!=null || arr!=undefined){
                        arr.push(req.body.meaning2);
                        foundUser.knowledgeCheck.set(req.body.word, arr);
                    }  
                    else{
                        var newArr = [];
                        var w = req.body.word;
                        newArr.push(foundUser.wordsForaDay.get(w));
                        newArr.push(req.body.meaning2);
                        foundUser.knowledgeCheck.set(req.body.word,newArr);
                    }
                    foundUser.save();     
                }
            }
        });
    }
})

app.post("/kC3Submit", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
                if (foundUser) {
                    var arr = foundUser.knowledgeCheck.get(req.body.word);  
                    if(arr!=null || arr!=undefined){
                        arr.push(req.body.meaning3);
                        foundUser.knowledgeCheck.set(req.body.word, arr);
                    }  
                    else{
                        var newArr = [];
                        var w = req.body.word;
                        newArr.push(foundUser.wordsForaDay.get(w));
                        newArr.push(req.body.meaning3);
                        foundUser.knowledgeCheck.set(req.body.word,newArr);
                    }
                    foundUser.save();     
                }
            }
        });
    }
})


app.get("/review", connectEnsureLogin.ensureLoggedIn() ,function(req, res){
    if(req.isAuthenticated()){
        res.render("review",{user: req.user});
    }
})

app.post("/review", connectEnsureLogin.ensureLoggedIn(), function(req, res){
    if(req.isAuthenticated()){
        const checkedItem = req.body.deletedItem;
        User.findById(req.user.id, function(err, foundUser){
            if (err) {
              console.log(err);
            } else {
                if (foundUser) {
                    foundUser.wordsForaDay.delete(checkedItem);
                    foundUser.knowledgeCheck.delete(checkedItem);
                    foundUser.learntWords.push(checkedItem);
                    foundUser.save();
                    res.render("review",{user:req.user});
                }
            }
        });
    }
})


app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/login");
        });
      }
    });
  
  });

  app.get('/login', function (req, res) {
    res.render('login');
  });


  app.post('/login', function(req, res) {
    passport.authenticate('local',
        function(err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect("/login");
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.redirect("/dashboard");
            });
        })(req, res);
});


  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });

app.listen(process.env.PORT || 3002, function(req, res){
    console.log("Server started at 3002");
})
