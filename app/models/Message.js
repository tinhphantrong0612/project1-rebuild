var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/Test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

var messageSchema = mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    users: [{
        _id: false,
        username: String,
        userId: mongoose.Types.ObjectId
    }],
    seen: [{
        _id: false,
        username: String,
        userId: mongoose.Types.ObjectId,
        seen: {
            type: Date,
            default: Date.now()
        }
    }],
    messageList: [{
        _id: false,
        senderId: mongoose.Types.ObjectId,
        sender: String,
        message: String,
        messageType: String,
        messageExt: String,
        messageIndex: Number,
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

module.exports = mongoose.model('Message', messageSchema);