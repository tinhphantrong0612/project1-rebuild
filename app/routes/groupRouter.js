var express = require('express');
var expressSession = require('express-session')
var groupRouter = express.Router();
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var User = require('../models/User');
var Message = require('../models/Message');
var path = require('path');
var fs = require('fs');
const { fstat } = require('fs');
var sessionStore = new mongoStore({
    url: 'mongodb://127.0.0.1/Session'
})

groupRouter.use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

groupRouter.route('/createGroup').post(function (req, res) {
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        var newMessage = new Message({
            _id: new mongoose.Types.ObjectId,
            users: [{
                username: req.session.username,
                userId: req.session.userId
            }],
            seen: [],
            messageList: [],
        })

        newMessage.save(function(err, message){
            if (err) throw err;
            else {
                if (!fs.existsSync(__dirname + '/../../public/img/messages/' + message._id)){
                    fs.mkdirSync(__dirname + '/../../public/img/messages/' + message._id);
                }
                User.findByIdAndUpdate(req.session.userId, {
                    $push: {
                        groupList: {
                            groupId: new mongoose.Types.ObjectId,
                            groupName: req.body.groupName,
                            messageId: message._id
                        }
                    }
                }, function(err, user){
                    if (err) throw err;
                    else {
                        req.app.io.emit('contact list change');
                        res.send({
                            isSuccess: true,
                            messageId: message._id
                        })
                    }
                })
            }
        })
    }
})

groupRouter.route('/addToGroup').post(function(req, res){
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        Message.findById(req.body.messageId, function(err, message){
            if (err) throw err;
            var newUser = [];
            var tempIndex = req.body.messageIndex;
            var date = Date.now();
            req.body.addList.forEach(function(user){
                var i = message.users.findIndex(member => member.userId == user.userId);
                if (i == - 1){
                    message.users.push(user);
                    newUser.push(user);
                    message.messageList.push({
                        senderId: req.session.userId,
                        sender: req.session.username,
                        message: req.session.username + ' added ' + user.username + '.',
                        messageType: 'inform',
                        messageExt: '',
                        messageIndex: tempIndex,
                        sent: date
                    })
                    message.seen = [];
                    req.app.io.in(req.body.messageId).in(user.userId).emit('new member add to group', {
                        messageId: req.body.messageId,
                        userId: user.userId,
                        inform: {
                            senderId: req.session.userId,
                            sender: req.session.username,
                            message: req.session.username + ' added ' + user.username + '.',
                            messageType: 'inform',
                            messageExt: '',
                            messageIndex: tempIndex,
                            sent: new Date(date)
                        }
                    });
                    tempIndex += 1;
                }
            })
            message.save(function(err, mess){
                if(err) throw err;
                else {
                    newUser.forEach(function(user){
                        User.findById(user.userId, function(err, person){
                            var ii = person.groupList.findIndex(group => group.groupId == req.body.groupId);
                            if (ii == -1) person.groupList.push({
                                groupId: req.body.groupId,
                                groupName: req.body.groupName,
                                messageId: req.body.messageId
                            })
                            person.save();
                        })
                    })
                }
                res.send({
                    isSuccess: true
                })
            })
        })
    }
})

groupRouter.route('/leaveGroup').post(function(req, res){
    if (!req.session.userId) {
        res.redirect('/');
        return;
    } else {
        User.findByIdAndUpdate(req.session.userId, {
            $pull: {
                groupList: {
                    groupId: req.body.groupId
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
        }, function(err, user){
            if (err) throw err;
            else {
                var date = Date.now();
                if (req.body.numOfMem == 1){
                    Message.findByIdAndDelete(req.body.messageId, function(err, message){
                        if (!message) return;
                        var messageId = message._id;
                        if (fs.existsSync(__dirname + '/../../public/img/messages/' + messageId)){
                            fs.rmdir(__dirname + '/../../public/img/messages/' + messageId, {recursive: true, force: true}, function(){
                                console.log("Removed");
                            });
                        }

                        res.send({
                            isSuccess: true
                        })
                    })
                } else {
                    Message.findByIdAndUpdate(req.body.messageId, {
                        $pull: {
                            users: {
                                userId: req.session.userId
                            }
                        },
                        $push: {
                            messageList: {
                                senderId: req.session.userId,
                                sender: req.session.username,
                                message: req.session.username + ' had left.',
                                messageType: 'inform',
                                messageExt: '',
                                messageIndex: req.body.messageIndex,
                                sent: new Date(date)
                            }
                        },
                        $set: {
                            seen: []
                        }
                    }, function(err, mess){
                        req.app.io.in(req.body.messageId).in(req.session.userId).emit('someone leave group', {
                            userId: req.session.userId,
                            messageId: req.body.messageId,
                            inform: {
                                senderId: req.session.userId,
                                sender: req.session.username,
                                message: req.session.username + ' had left.',
                                messageType: 'inform',
                                messageExt: '',
                                messageIndex: req.body.messageIndex,
                                sent: new Date(date)
                            }
                        })
                        res.send({
                            isSuccess: true
                        })
                    })
                }
            }
        })
    }
})

module.exports = groupRouter;