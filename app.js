require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const _ = require('lodash');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//setup app
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//setup session data, ordering from here is important
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//connect to local db
mongoose.connect("mongodb://localhost:27017/blogDB", {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false
});

mongoose.set("useCreateIndex", true);

//create schema for posts
const postSchema = new mongoose.Schema({
    title: String,
    content: String
});

const Post = mongoose.model("Post", postSchema);

//user setup
const userSchema = new mongoose.Schema({
    username: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//passport setup - serialise functions are more general
passport.use(User.createStrategy());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

//root route
app.get("/", function(req, res){

    //find all posts and post them in reverse order (newest to oldest)
    Post.find(function(err, posts){
        res.render("index", {
            loggedIn: req.isAuthenticated(), 
            posts: posts.reverse()
        });
    });
});

//login routes
app.get("/login", function(req, res){
    res.render("login", {
        loggedIn: req.isAuthenticated()
    });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}), function(req, res){

});

//logout
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

//shows a particular post with a given id
app.get("/posts/:postId", function(req, res){

    const postId = req.params.postId;
    
    Post.findById(postId, function(err, post){

        if(!err){
            res.render("posts", {
                loggedIn: req.isAuthenticated(), 
                post: post
            });
        }
    });
});

//about page
app.get("/about", function(req, res){
    res.render("about", {
        loggedIn: req.isAuthenticated(), 
    });
});

//contact page
app.get("/contact", function(req, res){
    res.render("contact", {
        loggedIn: req.isAuthenticated(), 
    });
});

//compose page
app.get("/compose", function(req, res){

    if(req.isAuthenticated()){
        res.render("compose", {
            loggedIn: req.isAuthenticated(), 
        });
    } else {
        res.redirect("/login");
    }

});

//add a new post to the db depending on if they've entered content or not
app.post("/compose", function(req, res){
    const postTitle = req.body.postTitle;
    const postContent = req.body.postContent;

    if(postTitle === "" || postContent === "") {
        res.redirect("/compose");
    } else {
        const post = new Post({
            title: postTitle,
            content: postContent
        });

        post.save();

        res.redirect("/");
    }

});

//routes to edit. Displays previous content if id exists
app.get("/posts/:postId/edit", function(req, res){

    if(req.isAuthenticated()){
        const postId = req.params.postId;

        Post.findById(postId, function(err, post){
    
            if(!err){
                res.render("edit", {
                    loggedIn: req.isAuthenticated(),
                    post: post
                });
            } else {
                res.redirect("/compose");
            }
        });
    } else {
        res.redirect("/login");
    }

});

//updates a document based on edits made by user
app.post("/posts/:postId/edit", function(req, res){
    const postId = req.params.postId;
    const postTitle = req.body.postTitle;
    const postContent = req.body.postContent;

    if(postTitle === "" || postContent === "") {
        res.redirect("/compose");
    } else {
        
        Post.findByIdAndUpdate(postId, {title: postTitle, content: postContent}, function(err){
            if(!err){
                res.redirect("/");
            }
        });
    }

});

//deletes a post from the db
app.get("/posts/:postId/delete", function(req, res){
    if(req.isAuthenticated()){
        const postId = req.params.postId;

        Post.findByIdAndDelete(postId, function(err){
            if(!err){
                res.redirect("/");
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.listen(3000, function(){
    console.log("Server listening on port 3000");
});