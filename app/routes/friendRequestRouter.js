var express = require('express');
var expressSession = require('express-session');
var friendRequestRouter = express.Router();
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var User = require('../models/User');
var Message = require('../models/Message');
var path = require('path');
var fs = require('fs');
var sessionStore = new mongoStore({
    url: 'mongodb://127.0.0.1/Session'
})

friendRequestRouter.use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

friendRequestRouter.route('/send').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        User.findByIdAndUpdate(req.session.userId, {
            $push: {
                sentFriendRequests: {
                    username: req.body.username,
                    userId: req.body.userId
                }
            }
        }, function(err, user){
            if (err) throw err;
            else {
                User.findByIdAndUpdate(req.body.userId, {
                    $push: {
                        receivedFriendRequests: {
                            username: user.username,
                            userId: user._id
                        }
                    }
                }, function(err, otherUser){
                    if (err) throw err;
                    else {
                        req.app.io.in(req.session.userId).emit('friend request change');
                        req.app.io.in(req.body.userId).emit('friend request change');
                        res.send({
                            isSuccess: true
                        })
                    }
                })
            }
        })
    }
})

friendRequestRouter.route('/cancel').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        User.findByIdAndUpdate(req.session.userId, {
            $pull: {
                sentFriendRequests: {
                    username: req.body.username,
                    userId: req.body.userId
                }
            }
        }, function(err, user){
            if (err) throw err;
            else {
                User.findByIdAndUpdate(req.body.userId, {
                    $pull: {
                        receivedFriendRequests: {
                            username: user.username,
                            userId: user._id
                        }
                    }
                }, function(err, otherUser){
                    if (err) throw err;
                    else {
                        req.app.io.in(req.session.userId).emit('friend request change');
                        req.app.io.in(req.body.userId).emit('friend request change');
                        res.send({
                            isSuccess: true
                        })
                    }
                })
            }
        })
    }
})

friendRequestRouter.route('/accept').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        var newMessage = new Message({
            _id: new mongoose.Types.ObjectId,
            users: [{
                userId: req.session.userId,
                username: req.session.username
            }, {
                userId: req.body.userId,
                username: req.body.username
            }],
            seen: [],
            messageList: [],
            created: Date.now()
        })
        
        newMessage.save(function(err, message){
            if (err) throw err;
            else {
                if (!fs.existsSync(__dirname + '/../../public/img/messages/' + message._id)){
                    fs.mkdirSync(__dirname + '/../../public/img/messages/' + message._id);
                }
                User.findByIdAndUpdate(req.session.userId, {
                    $pull: {
                        receivedFriendRequests: {
                            userId: req.body.userId
                        }
                    },
                    $push: {
                        friendList: {
                            userId: req.body.userId,
                            username: req.body.username,
                            messageId: message._id
                        }
                    }
                }, function(err, user){
                    User.findByIdAndUpdate(req.body.userId, {
                        $pull: {
                            sentFriendRequests: {
                                userId: req.session.userId
                            }
                        },
                        $push: {
                            friendList: {
                                userId: req.session.userId,
                                username: req.session.username,
                                messageId: message._id
                            }
                        }
                    }, function(err, otherUser){
                        if (err) throw err;
                        else {
                            req.app.io.in(req.session.userId).emit('contact list change');
                            req.app.io.in(req.body.userId).emit('contact list change');
                            res.send({
                                isSuccess: true
                            })
                        }
                    })
                })
            }
        })
    }
})

friendRequestRouter.route('/decline').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        User.findByIdAndUpdate(req.session.userId, {
            $pull: {
                receivedFriendRequests: {
                    userId: req.body.userId
                }
            }
        }, function(err, user){
            if (err) throw err;
            else {
                User.findByIdAndUpdate(req.body.userId, {
                    $pull: {
                        sentFriendRequests: {
                            userId: req.session.userId
                        }
                    }
                }, function(err, otherUser){
                    if (err) throw err;
                    else {
                        req.app.io.in(req.session.userId).emit('friend request change');
                        req.app.io.in(req.body.userId).emit('friend request change');
                        res.send({
                            isSuccess: true
                        })
                    }
                })
            }
        })
    }
})

friendRequestRouter.route('/unfriend').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        Message.findByIdAndDelete(req.body.messageId, function(err, message){
            if (!message) return;
            var messageId = message._id;
            if (fs.existsSync(__dirname + '/../../public/img/messages/' + messageId)){
                fs.rmdir(__dirname + '/../../public/img/messages/' + messageId, {recursive: true, force: true}, function(){
                    console.log("Removed");
                });
            }
        })
        User.findByIdAndUpdate(req.session.userId, {
            $pull: {
                friendList: {
                    userId: req.body.userId
                }
            },
            $set: {
                lastContact: {
                    lastContactId: null,
                    lastContactName: null,
                    lastContactType: null,
                    lastContactMessageId: null
                }
            }
        }, function(err, sender){
            if (err) throw err;
            User.findById(req.body.userId, function(err, receiver){
                receiver.friendList.pull({userId: req.session.userId})
                if (receiver.lastContact.lastContactId == req.session.userId) {
                    receiver.lastContact.lastContactType = null,
                    receiver.lastContact.lastContactId = null,
                    receiver.lastContact.lastContactName = null,
                    receiver.lastContact.lastContactMessageId = null
                }
                receiver.save(function(err, person){
                    if (err) throw err;
                    req.app.io.to(req.session.userId).emit('unfriended', {
                        unfriend: req.session.userId,
                        beunfriend: req.body.userId
                    });
                    req.app.io.to(req.body.userId).emit('be unfriended', {
                        unfriend: req.session.userId,
                        beunfriend: req.body.userId
                    });
                    res.send({
                        isSuccess: true
                    })
                })
            })
        })
    }
})

module.exports = friendRequestRouter;