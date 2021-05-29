var express = require('express');
var expressSession = require('express-session')
var userRouter = express.Router();
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var User = require('../models/User');
var Message = require('../models/Message')
var path = require('path')
var sessionStore = new mongoStore({
    url: 'mongodb://127.0.0.1/Session'
})

userRouter.use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

userRouter.route('/getUserDetails').get(function (req, res) {
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        User.findById(req.session.userId, function (err, user) {
            if (err) throw err;
            else {
                res.send({
                    userId: user._id,
                    username: user.username,
                    status: user.status,
                    lastContact: user.lastContact,
                    friendList: user.friendList,
                    groupList: user.groupList,
                    sentFriendRequests: user.sentFriendRequests,
                    receivedFriendRequests: user.receivedFriendRequests
                })
            }
        })
    }
})

userRouter.route('/getLastMessage').get(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        res.send({
            nothing: 'nothing'
        })
        User.findById(req.session.userId, function(err, user){
            user.friendList.forEach(function(friend){
                // Get all last message and emit to user
                Message.findById(friend.messageId, function(err, message){
                    if (!message) return;
                    if (message.messageList.length > 0){
                        req.app.io.to(req.session.userId).emit('last message', {
                            lastMessage: message.messageList[message.messageList.length - 1],
                            friend: friend.userId
                        })
                    } else {
                        req.app.io.to(req.session.userId).emit('last message', {
                            friend: friend.userId
                        })
                    }
                })
            })
            user.groupList.forEach(function(group){
                // Get all last group message emit to user
                Message.findById(group.messageId, function(err, message){
                    if (message.messageList.length > 0){
                        req.app.io.to(req.session.userId).emit('group last message', {
                            lastMessage: message.messageList[message.messageList.length - 1],
                            group: group.groupId
                        })
                    } else {
                        req.app.io.to(req.session.userId).emit('group last message', {
                            group: group.groupId
                        })
                    }
                })
            })
        })
    }
})

userRouter.route('/getContactList').get(function (req, res) {
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        User.findById(req.session.userId, function (err, user) {
            if (err) throw err;
            else {
                res.send({
                    friendList: user.friendList,
                    groupList: user.groupList
                })
            }
        })
    }
})

userRouter.route('/getFriendRequests').get(function (req, res) {
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        User.findById(req.session.userId, function (err, user) {
            if (err) throw err;
            else {
                res.send({
                    sentFriendRequests: user.sentFriendRequests,
                    receivedFriendRequests: user.receivedFriendRequests
                })
            }
        })
    }
})

userRouter.route('/search/:searchName').get(function (req, res) {
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        var friendList = [];
        var searchResult = [];
        User.findById(req.session.userId, function (err, user) {
            if (err) throw err;
            else {
                friendList = user.friendList;
                User.find({ 'username': { "$regex": req.params['searchName'], "$options": 'i' } }, function (err, users) {
                    if (err) throw err;
                    else {
                        users.forEach(function (user) {
                            if (user._id != req.session.userId && friendList.findIndex(friend => friend.userId == user._id) == -1) {
                                searchResult.push({
                                    username: user.username,
                                    userId: user._id
                                })
                            }
                        })

                        res.send({
                            searchResult: searchResult
                        })
                    }
                })
            }
        })
    }
})

module.exports = userRouter;