var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/Test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

var userSchema = mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    status: String,
    lastContact: {
        lastContactId: mongoose.Types.ObjectId,
        lastContactName: String,
        lastContactType: String,
        lastContactMessageId: mongoose.Types.ObjectId
    },
    socketId: '',
    friendList: [{
        _id: false,
        username: String,
        userId: mongoose.Types.ObjectId,
        messageId: mongoose.Types.ObjectId,
        beFriended: {
            type: Date,
            default: Date.now()
        }
    }],
    groupList: [{
        _id: false,
        groupName: String,
        groupId: mongoose.Types.ObjectId,
        messageId: mongoose.Types.ObjectId,
        joint: {
            type: Date,
            default: Date.now()
        }
    }],
    sentFriendRequests: [{
        _id: false,
        userId: mongoose.Types.ObjectId,
        username: String,
        sent: {
            type: Date,
            default: Date.now()
        }
    }],
    receivedFriendRequests: [{
        _id: false,
        userId: mongoose.Types.ObjectId,
        username: String,
        sent: {
            type: Date,
            default: Date.now()
        }
    }],
    created: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('User', userSchema);