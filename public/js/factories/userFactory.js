chatApp.factory('User', ['$http', 'socket', function($http, socket){
    var User = {
        username: '',
        userId: '',
        status: '',
        friendList: [],
        groupList: [],
        lastContact: {},
        sentFriendRequests: [],
        receivedFriendRequests: []
    };

    User.init = function(){
        User.username = '',
        User.userId = '',
        User.status = '',
        User.friendList = [],
        User.groupList = [],
        User.lastContact = {},
        User.sentFriendRequests = [],
        User.receivedFriendRequests = []
    }

    User.getUserDetails = function(){
        $http.get('/user/getUserDetails').then(function(response){
            User.username = response.data.username;
            User.userId = response.data.userId;
            User.status = response.data.status;
            User.friendList = response.data.friendList;
            User.groupList = response.data.groupList;
            User.lastContact = response.data.lastContact;
            User.sentFriendRequests = response.data.sentFriendRequests;
            User.receivedFriendRequests = response.data.receivedFriendRequests;
            // Emit to let all know that user is online
            socket.emit('online', User.userId);
            User.getLastMessage();
        })
    }

    User.getContactList = function(){
        $http.get('/user/getContactList').then(function(response){
            User.friendList = response.data.friendList;
            User.groupList = response.data.groupList;
            socket.emit('online', User.userId);
            User.getLastMessage();
        })
    }

    User.getLastMessage = function(){
        $http.get('/user/getLastMessage').then(function(response){
            return;
        })
    }

    User.getFriendRequests = function(){
        $http.get('/user/getFriendRequests').then(function(response){
            User.sentFriendRequests = response.data.sentFriendRequests;
            User.receivedFriendRequests = response.data.receivedFriendRequests;
        })
    }
    
    return User;
}])