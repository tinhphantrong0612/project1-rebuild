chatApp.directive('myMessages', function () {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'views/contentpanel/myMessages.html',
        scope: {},
        controller: ['$scope', '$location', '$anchorScroll', 'User', 'Message', 'socket', function ($scope, $location, $anchorScroll, User, Message, socket) {
        // Link to factory
            $scope.User = User;
            $scope.Message = Message;

        // Declare isolated scope variable

        // Declare non-scope variable
            var videos = [];

        // Declare isolated scope function

        // Declare non-scope function
            scrollToBottom = function () { // Scroll to bottom whenever send or receive a message
                $location.hash('seen');
                $anchorScroll();
                $location.hash('');
                $location.replace();
            }

            setVideoEventListener = function() { // Set listener for all video, allow only one video play at a time
                videos = document.querySelectorAll('video');
                for (var i = 0; i < videos.length; i++){
                    videos[i].addEventListener('play', function(){
                        pauseAll(this);
                    }, true);
                }
            }

            pauseAll = function(element){ // Pause all video not this video
                for (var i = 0; i < videos.length; i++){
                    if (videos[i] == element) continue;
                    if (videos[i].played.length > 0 && !videos[i].paused){
                        videos[i].pause();
                    }
                }
            }

        // Scope listener
            $scope.$on('rendered', function(event, index){ // Listen all message was rendered, then set video listener
                scrollToBottom();
                setVideoEventListener();
            })

        // Handle socket event
            socket.on('message from user', function (msg) { // Receive message from user
                // If user is having conversation with sender, or user is sender
                if ($scope.User.userId == msg.senderId || $scope.Message.receiverId == msg.senderId) {
                    // push new message in message list
                    $scope.Message.messageCount++;
                    $scope.Message.messageList.push({
                        senderId: msg.senderId,
                        sender: msg.sender,
                        message: msg.message,
                        messageType: msg.messageType,
                        messageExt: msg.messageExt,
                        messageIndex: msg.messageIndex,
                        sent: msg.sent
                    })
                    // Set last sender
                    $scope.Message.lastSender = msg.senderId;
                    // emit to inform this user have seen this message
                    socket.emit('received message', {
                        messageId: $scope.Message.messageId,
                        userId: $scope.User.userId,
                        username: $scope.User.username
                    })
                    scrollToBottom();
                }

                if ($scope.User.userId == msg.senderId) {
                    // Update message preview if user is sender
                    var i = $scope.User.friendList.findIndex(friend => friend.userId == msg.receiverId);
                    if (i > -1) {
                        if (msg.message.length > 30) msg.message = msg.message.slice(0, 29) + '...';
                        $scope.User.friendList[i].lastMessage = {
                            senderId: msg.senderId,
                            sender: msg.sender,
                            message: msg.message,
                            messageType: msg.messageType,
                            messageExt: msg.messageExt,
                            messageIndex: msg.messageIndex,
                            sent: msg.sent
                        };
                    }
                } else {
                    // update message preview if user is not sender
                    var i = $scope.User.friendList.findIndex(friend => friend.userId == msg.senderId);
                    if (i > -1) {
                        if (msg.message.length > 30) msg.message = msg.message.slice(0, 29) + '...';
                        $scope.User.friendList[i].lastMessage = {
                            senderId: msg.senderId,
                            sender: msg.sender,
                            message: msg.message,
                            messageType: msg.messageType,
                            messageExt: msg.messageExt,
                            messageIndex: msg.messageIndex,
                            sent: msg.sent
                        };
                    }
                }
            })

            socket.on('message from group', function (msg) { // Handle message from a group
                // If this message from this group
                if (msg.messageId == $scope.Message.messageId) {
                    // push message in message list
                    $scope.Message.messageCount++;
                    $scope.Message.messageList.push({
                        senderId: msg.senderId,
                        sender: msg.sender,
                        message: msg.message,
                        messageType: msg.messageType,
                        messageExt: msg.messageExt,
                        messageIndex: msg.messageIndex,
                        sent: msg.sent
                    })
                    // Set last sender
                    $scope.Message.lastSender = msg.senderId;
                    // Emit received
                    socket.emit('received message', {
                        messageId: $scope.Message.messageId,
                        userId: $scope.User.userId,
                        username: $scope.User.username
                    })
                    scrollToBottom();
                }

                var i = $scope.User.groupList.findIndex(group => group.messageId == msg.messageId);
                if (i > -1) {
                    // Just find group and update last message
                    if (msg.message.length > 30) msg.message = msg.message.slice(0, 29) + '...';
                    $scope.User.groupList[i].lastMessage = {
                        senderId: msg.senderId,
                        sender: msg.sender,
                        message: msg.message,
                        messageType: msg.messageType,
                        messageExt: msg.messageExt,
                        messageIndex: msg.messageIndex,
                        sent: msg.sent
                    };
                }
            })

            // Receive seen update then update seen array
            socket.on('seen update', function (seen) {
                if ($scope.Message.messageId == seen.messageId) {
                    $scope.Message.seen = seen.seen;
                    Message.generateSeenText();
                }
            })
        }]
    }
})