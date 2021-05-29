var express = require('express');
var expressSession = require('express-session');
var path = require('path');
var fs = require('fs');
var mongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

var config = require('./config/config');

var sessionStore = new mongoStore({
    url: config.sessionUrl
});

var server = express().use(express.json()).use(express.urlencoded({ extended: true })).use(expressSession({
    secret: 'supersecretkey',
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}))

var http = require('http').createServer(server);
var io = require('socket.io')(http);
server.io = io;

var authRouter = require('./app/routes/authRouter');
var userRouter = require('./app/routes/userRouter');
var friendRequestRouter = require('./app/routes/friendRequestRouter');
var messageRouter = require('./app/routes/messageRouter');
var groupRouter = require('./app/routes/groupRouter');

var User = require('./app/models/User');
var Message = require('./app/models/Message');

server.use('/auth', authRouter);
server.use('/user', userRouter);
server.use('/friendRequest', friendRequestRouter);
server.use('/message', messageRouter);
server.use('/group', groupRouter);

server.use(express.static('public', { index: false }));

server.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, './public/index.html'));
});

// On start
User.find({}, function (err, users) {
    if (err) throw err;
    else {
        users.forEach(function (user) {
            user.status = 'offline';
            user.save();
        })
    }
})

// request.post({
//     url: 'http://203.171.20.94:8012/api/AccessControl/GetUserInfor',
//     json: {
//         "deviceId":"8a0fc66a61a959f6",
//         "qrCodeId": "a652d57094b7590b0dea115b156c07098abdea87",
//         "qrCodeValue":"P22498244182551944"
//     }
// }, function(err, res){
//     console.log(res.body);
// })

io.on('connection', function (socket) {
    console.log(socket.id + ' connected');

    // Handle user init
    socket.on('init', function (id) {
        if (!id) return;
        // Emit back to browser to get user details
        socket.emit('user details');
        // Join the room with name is user id
        socket.join(id);
        // Find User
        User.findByIdAndUpdate(id, {
            // set user status online
            $set: {
                status: 'online',
                socketId: socket.id
            }
        }, function (err, user) {
            if (err) throw err;
            else {
                // Join all group room with name is messageId
                user.groupList.forEach(function (group) {
                    // Need to make group.messageId into String
                    var temp = '' + group.messageId;
                    socket.join(temp);
                })
                // Emit back to browser to get conversation with last contact
                socket.emit('last contact', user.lastContact)
            }
        })
    })

    // Receive online event of user and broadcast to all user
    socket.on('online', function (id) {
        if (!id) return;
        else {
            socket.broadcast.emit('online', id);
        }
    })

    // After receive online inform, emit back to server, server emit to client
    socket.on('online too', function (address) {
        socket.broadcast.emit('online too', address.from);
    })

    socket.on('disconnecting', function (socket) {
        // Get user id of disconnecting socket
        User.findOneAndUpdate({ socketId: socket.id }, {
            $set: {
                status: 'offline',
                socketId: ''
            }
        }, function (err, user) {
            if (err) throw err;
            else {
                if (!user) return;
                // Emit that user disconnecting
                io.emit('offline', user._id);
            }
        })
    })

    // Handle text message
    socket.on('text message', function (msg) {
        var splitMessage = msg.message.split('/');
        var mark = false;
        for (var i = 0; i < splitMessage.length; i++) {
            if (splitMessage[i].includes('.com') || (splitMessage[i].includes('.vn') || (splitMessage[i].includes('.net') || (splitMessage[i].includes('.io')) || (splitMessage[i].includes('.org'))))) {
                mark = true;
                break;
            }
        }

        var tempMessage = msg.message;
        if (mark && !(splitMessage[0] == 'https:' || splitMessage[0] == 'http:')) {
            tempMessage = 'https://' + msg.message;
        }

        if (!mark) {
            Message.findById(msg.messageId, function (err, message) {
                message.seen = [{
                    userId: msg.senderId,
                    username: msg.sender
                }]
                var date = new Date(msg.sent)
                // Store in database and update seen
                message.messageList.push({
                    senderId: msg.senderId,
                    sender: msg.sender,
                    message: msg.message,
                    messageType: msg.messageType,
                    messageExt: msg.messageExt,
                    messageIndex: msg.messageIndex,
                    sent: msg.sent
                })
                message.save(function (err, mess) {
                    if (msg.receiverType == 'user') {
                        // Emit to sender and receiver
                        io.in(msg.senderId).in(msg.receiverId).emit('message from user', {
                            senderId: msg.senderId,
                            sender: msg.sender,
                            receiverId: msg.receiverId,
                            message: msg.message,
                            messageType: msg.messageType,
                            messageExt: msg.messageExt,
                            messageIndex: msg.messageIndex,
                            sent: date
                        });
                    } else if (msg.receiverType == 'group') {
                        // Emit to group
                        io.in(msg.messageId).emit('message from group', {
                            senderId: msg.senderId,
                            sender: msg.sender,
                            messageId: msg.messageId,
                            message: msg.message,
                            messageType: msg.messageType,
                            messageExt: msg.messageExt,
                            messageIndex: msg.messageIndex,
                            sent: date
                        })
                    }
                })
            })
        } else {
            request(tempMessage, function (error, response, html) {
                if (!error && response.statusCode == 200) {
                    Message.findById(msg.messageId, function (err, message) {
                        message.seen = [{
                            userId: msg.senderId,
                            username: msg.sender
                        }]

                        var date = new Date(msg.sent)

                        message.messageList.push({
                            senderId: msg.senderId,
                            sender: msg.sender,
                            message: msg.message,
                            messageType: 'link',
                            messageExt: tempMessage,
                            messageIndex: msg.messageIndex,
                            sent: msg.sent
                        })
                        message.save(function (err, mess) {
                            if (msg.receiverType == 'user') {
                                // Emit to sender and receiver
                                io.in(msg.senderId).in(msg.receiverId).emit('message from user', {
                                    senderId: msg.senderId,
                                    sender: msg.sender,
                                    receiverId: msg.receiverId,
                                    message: msg.message,
                                    messageType: 'link',
                                    messageExt: tempMessage,
                                    messageIndex: msg.messageIndex,
                                    sent: date
                                });
                            } else if (msg.receiverType == 'group') {
                                // Emit to group
                                io.in(msg.messageId).emit('message from group', {
                                    senderId: msg.senderId,
                                    sender: msg.sender,
                                    messageId: msg.messageId,
                                    message: msg.message,
                                    messageType: 'link',
                                    messageExt: tempMessage,
                                    messageIndex: msg.messageIndex,
                                    sent: date
                                })
                            }
                        })
                    })
                } else {
                    Message.findById(msg.messageId, function (err, message) {
                        message.seen = [{
                            userId: msg.senderId,
                            username: msg.sender
                        }]

                        var date = new Date(msg.sent)
                        // Store in database and update seen
                        message.messageList.push({
                            senderId: msg.senderId,
                            sender: msg.sender,
                            message: msg.message,
                            messageType: msg.messageType,
                            messageExt: msg.messageExt,
                            messageIndex: msg.messageIndex,
                            sent: msg.sent
                        })
                        message.save(function (err, mess) {
                            if (msg.receiverType == 'user') {
                                // Emit to sender and receiver
                                io.in(msg.senderId).in(msg.receiverId).emit('message from user', {
                                    senderId: msg.senderId,
                                    sender: msg.sender,
                                    receiverId: msg.receiverId,
                                    message: msg.message,
                                    messageType: msg.messageType,
                                    messageExt: msg.messageExt,
                                    messageIndex: msg.messageIndex,
                                    sent: date
                                });
                            } else if (msg.receiverType == 'group') {
                                // Emit to group
                                io.in(msg.messageId).emit('message from group', {
                                    senderId: msg.senderId,
                                    sender: msg.sender,
                                    messageId: msg.messageId,
                                    message: msg.message,
                                    messageType: msg.messageType,
                                    messageExt: msg.messageExt,
                                    messageIndex: msg.messageIndex,
                                    sent: date
                                })
                            }
                        })
                    })
                }
            })
        }
    })

    // If receiver is open conversation with user, socket will emit this message, then handle it
    socket.on('received message', function (user) {
        Message.findById(user.messageId, function (err, message) {
            var i = message.seen.findIndex(person => person.userId == user.userId)
            var temp = message.seen;
            if (i == -1) {
                // If user have not seen the message, push user in seen list
                message.seen.push({
                    userId: user.userId,
                    username: user.username
                })
            }

            message.save(function (err, mess) {
                io.to(user.messageId).emit('seen update', { // Emit to all user, if user have conversation using messageId
                    seen: temp,
                    messageId: user.messageId
                })
            })
        })
    })

    // Handle file message
    socket.on('file message', function (msg) {
        // Save file
        try {
            let writer = fs.createWriteStream(path.resolve(__dirname, './public/img/messages/' + msg.messageId + '/' + msg.messageIndex + '.' + msg.messageExt), {
                encoding: 'base64'
            })
            writer.write(msg.data);
            writer.end;
        }
        catch (err) {
            throw err;
        }

        var date = new Date(msg.sent);
        Message.findById(msg.messageId, function (err, message) {
            message.seen = [{
                userId: msg.senderId,
                username: msg.sender
            }]
            // Store in database and update seen
            message.messageList.push({
                senderId: msg.senderId,
                sender: msg.sender,
                message: msg.message,
                messageType: msg.messageType,
                messageExt: msg.messageExt,
                messageIndex: msg.messageIndex,
                sent: msg.sent
            })
            message.save(function (err, mess) {
                if (msg.receiverType == 'user') {
                    // Emit to sender and receiver
                    io.in(msg.senderId).in(msg.receiverId).emit('message from user', {
                        senderId: msg.senderId,
                        sender: msg.sender,
                        receiverId: msg.receiverId,
                        message: msg.message,
                        messageType: msg.messageType,
                        messageExt: msg.messageExt,
                        messageIndex: msg.messageIndex,
                        sent: date
                    });
                } else if (msg.receiverType == 'group') {
                    // Emit to group
                    io.in(msg.messageId).emit('message from group', {
                        senderId: msg.senderId,
                        sender: msg.sender,
                        messageId: msg.messageId,
                        message: msg.message,
                        messageType: msg.messageType,
                        messageExt: msg.messageExt,
                        messageIndex: msg.messageIndex,
                        sent: date
                    })
                }
            })
        })
    })

    // Handle get link details
    socket.on('get link details', function (messageObj) {
        request(messageObj.message.messageExt, function (err, response, html) {
            if (!err && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var title = '';
                var iconLink = '';

                if ($('head title').text()) {
                    title = $('head title').text();
                } else {
                    title = $('body title').text();
                }

                var linkSplit = messageObj.message.messageExt.split('/');

                if ($('meta[itemprop*="image"]')[0]){
                    iconLink = $('meta[itemprop*="image"]')[0].attribs.content;
                } else if ($('meta[property*="og:image"]')[0]){
                    iconLink = $("meta[property*='og:image']")[0].attribs.content;
                } else if ($("[rel*='icon']")[0]) {
                    var temp = $("[rel*='icon']").length;
                    iconLink = $("[rel*='icon']")[temp - 1].attribs.href;
                } else if ($("img")[0]) {
                    iconLink = $("img")[0].attribs.src;
                }

                if (iconLink){
                    if (!iconLink.includes('.net') && !iconLink.includes('.com') && !iconLink.includes('.org') && !iconLink.includes('.vn') && !iconLink.includes('.io')) {
                        if (!iconLink.includes('/')){
                            iconLink = messageObj.message.messageExt + '/' + iconLink;
                        } else if (linkSplit[2].includes('www')){
                            iconLink = linkSplit[0] + '//' + linkSplit[2] + iconLink;
                        } else {
                            iconLink = linkSplit[0] + '//' + 'www.' + linkSplit[2] + iconLink;
                        }
                    } else if (!iconLink.includes('http')) {
                        iconLink = 'https:' + iconLink;
                    }
                }

                io.to(socket.id).emit('link details', {
                    title: title,
                    iconLink: iconLink,
                    messageId: messageObj.messageId,
                    index: messageObj.message.messageIndex,
                })
            }
        })
    })

    // Handle join and leave group
    socket.on('join new group', function (messageId) {
        socket.join(messageId);
    })

    socket.on('leave group', function (messageId) {
        socket.leave(messageId);
    })
    // Handle logout
    socket.on('logout', function (userId) {
        io.emit('offline', userId);
    })

    // Handle disconnect
    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected");
        User.findOneAndUpdate({ socketId: socket.id }, {
            $set: {
                status: 'offline',
                socketId: ''
            }
        }, function (err, user) {
            if (err) throw err;
            else {
                if (!user) return;
                console.log(user._id);
                // Emit that user disconnect
                io.emit('offline', user._id);
            }
        })
    })
})

http.listen(3000);
console.log("Listen to 3000");