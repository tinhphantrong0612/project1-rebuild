chatApp.factory('Message', ['$http', function($http){
    var Message = {
        receiver: '',
        receiverId: '',
        receiverType: '',
        messageId: '',
        seen: [],
        seenText: '',
        messageList: [],
        messageCount: 0,
        lastSender: '',
        memberList: []
    }

    Message.init = function(){
        Message.receiver = '',
        Message.receiverId = '',
        Message.receiverType = '',
        Message.messageId = '',
        Message.seen = [],
        Message.seenText = '',
        Message.messageList = [],
        Message.messageCount = 0,
        Message.lastSender = '',
        Message.memberList = []
    }

    Message.getMessage = function(id, name, type, messageId){
        if (!id || !name || !type || !messageId) {
            Message.init();
            return;
        }
        Message.receiver = name;
        Message.receiverId = id;
        Message.receiverType = type;
        Message.messageId = messageId;
        $http.post('/message/getMessage', {contactId: id, contactName: name, contactType: type, messageId: messageId}).then(function(response){
            Message.seen = Array.from(new Set(response.data.seen));
            Message.generateSeenText();
            Message.messageList = response.data.messageList;
            Message.messageCount = Message.messageList.length;
            if (Message.messageCount > 0) Message.lastSender = Message.messageList[Message.messageCount - 1].senderId;
            Message.memberList = response.data.memberList;
        });
    }

    Message.getMemberList = function(){
        $http.post('/message/getMemberList', {
            messageId: Message.messageId
        }).then(function(response){
            Message.memberList = response.data.memberList;
        })
    }

    Message.generateSeenText = function(){
        if (Message.seen.length == 0) {
            Message.seenText = '';
        } else if (Message.seen.length == 1){
            Message.seenText = 'Seen by ' + Message.seen[0].username;
        } else if (Message.seen.length == 2){
            Message.seenText = 'Seen by ' + Message.seen[0].username + ', ' + Message.seen[1].username;
        } else {
            Message.seenText = 'Seen by ' + Message.seen[0].username + ', ' + Message.seen[1].username + ' and ' + (Message.seen.length - 2) + ' other.'
        }
    }

    return Message;
}])