var express = require('express');
var expressSession = require('express-session')
var authRouter = express.Router();
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var User = require('../models/User');
var path = require('path')
var sessionStore = new mongoStore({
    url: 'mongodb://127.0.0.1/Session'
})

authRouter.use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

authRouter.route('/').all(function(req, res){
    if (req.session.userId) res.redirect('./messages');
    else res.sendFile(path.resolve('./public/auth.html'));
});

authRouter.route('/register').post(function (req, res) {
    User.find({ 'username': req.body.username }, function(err, docs){
        if (docs.length == 0) {
            var tempUser = new User({
                _id: new mongoose.Types.ObjectId,
                username: req.body.username,
                password: req.body.password,
                status: 'offline',
                lastContact: {
                    lastContactId: null,
                    lastContactName: null,
                    lastContactType: null,
                    lastContactMessageId: null
                },
                friendList: [],
                sentFriendRequest: [],
                receivedFriendRequest: [],
                groupList: [],
                created: Date.now()
            })
            tempUser.save(function(err, doc){
                if (err) throw err;
                else {
                    res.send({
                        isSuccess: true
                    })
                    console.log(doc);
                }
            })
        } else {
            res.send({
                isSuccess: false
            })
            return;
        }
    })
});

authRouter.route('/login').post(function(req, res){
    User.findOne({username: req.body.username}, function(err, doc){
        if (!doc){
            res.send({
                isSuccess: false
            })
        } else if (doc.status != 'offline'){
            res.send({
                isSuccess: false
            })
        } else if (doc.password != req.body.password){
            res.send({
                isSuccess: false
            })
        } else {
            req.session.userId = doc._id;
            req.session.username = doc.username;
            res.send({
                isSuccess: true,
                userId: doc._id
            });
        }
    })
});

authRouter.route('/logout').post(function(req, res){
    User.findByIdAndUpdate(req.session.userId, {
        $set: {
            status: 'offline',
            socketId: ''
        }
    }, function(err, user){
        if (err) throw err;
        else {
            delete req.session.userId;
            delete req.session.username;
            res.send({
                isSuccess: true
            })
        }
    })
})

module.exports = authRouter;