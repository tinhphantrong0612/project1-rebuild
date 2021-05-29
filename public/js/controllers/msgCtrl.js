chatApp.controller('MsgController', ['$scope', '$cookies', 'User', 'Message', 'socket', function ($scope, $cookies, User, Message, socket) {
    // Global model using factory
    $scope.User = User;
    $scope.Message = Message;

    // Isolate scope

    // Scope function

    // Non-scope variable
    //Init
    socket.init();
    // Handle socket IO event
    socket.on('connect', function () {
        socket.emit('init', $cookies.get('userId'));
    })

    socket.on('user details', function () {
        $scope.User.getUserDetails();
    })

    socket.on('last contact', function (lastContact) {
        $scope.Message.getMessage(lastContact.lastContactId, lastContact.lastContactName, lastContact.lastContactType, lastContact.lastContactMessageId);
    })

    socket.on('online', function (id) {
        if (!$scope.User) return;
        var i = $scope.User.friendList.findIndex(friend => friend.userId == id);
        if (i > -1) {
            $scope.User.friendList[i].status = 'online';
            socket.emit('online too', {
                from: $scope.User.userId,
                to: id
            });
        }
    })

    socket.on('online too', function (id) {
        if (!$scope.User) return;
        var i = $scope.User.friendList.findIndex(friend => friend.userId == id);
        if (i > -1) {
            $scope.User.friendList[i].status = 'online';
        }
    })

    socket.on('cringe', function(){
        console.log("???????/")
    })
    socket.on('offline', function (id) {
        if (!$scope.User) return;
        var i = $scope.User.friendList.findIndex(friend => friend.userId == id);
        if (i > -1) {
            $scope.User.friendList[i].status = 'offline';
        }
    })

    socket.on('link details', function(details){
        if (!$scope.Message) return;
        if (details.messageId == $scope.Message.messageId){
            $scope.Message.messageList[details.index].title = details.title;
            $scope.Message.messageList[details.index].iconLink = details.iconLink;
        }
    })

    // Remove all socket listener on destroy
    $scope.$on('$destroy', function (event) {
        socket.emit('logout', $scope.User.userId);
        $scope.User.init();
        $scope.Message.init();
        socket.removeAllListeners();
        socket.disconnect();
    })
}])