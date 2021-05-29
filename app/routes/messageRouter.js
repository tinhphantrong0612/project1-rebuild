var express = require('express');
var expressSession = require('express-session')
var messageRouter = express.Router();
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var User = require('../models/User');
var Message = require('../models/Message');
var path = require('path');
var sessionStore = new mongoStore({
    url: 'mongodb://127.0.0.1/Session'
})

messageRouter.use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

messageRouter.route('/getMessage').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        User.findByIdAndUpdate(req.session.userId, {
            // Set last contact to this receiver
            $set: {
                lastContact: {
                    lastContactId: req.body.contactId,
                    lastContactName: req.body.contactName,
                    lastContactType: req.body.contactType,
                    lastContactMessageId: req.body.messageId
                }
            }
        }, function(err, user){
            if (err) throw err;
            else {
                Message.findById(req.body.messageId, function(err, message){
                    if (err) throw err;
                    if (!message) return;
                    var i = message.seen.findIndex(user => user.userId == req.session.userId);
                    var temp = message.seen;
                    if (i == -1 && message.messageList.length != 0) {
                        // If user is not in seen list and message list is not empty, push it in
                        message.seen.push({
                            userId: req.session.userId,
                            username: req.session.username
                        })
                        req.app.io.emit('seen update', {
                            seen: message.seen,
                            messageId: message._id
                        })
                    }
                    message.save(function(err, mess){
                        if (!mess) return;
                        res.send({
                            seen: temp,
                            messageList: mess.messageList,
                            memberList: mess.users
                        })
                    })
                })
            }
        })
    }
})

messageRouter.route('/getMemberList').post(function(req, res){
    if (!req.session.userId){
        res.redirect('/');
        return;
    } else {
        Message.findById(req.body.messageId, function(err, message){
            if (err) throw err;
            else {
                res.send({
                    memberList: message.users
                })
            }
        })
    }
})

module.exports = messageRouter;