chatApp.directive('contentHeader', function () {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'views/contentpanel/contentHeader.html',
        scope: {},
        controller: ['$scope', 'User', 'Message','Notify', 'socket', 'friendRequestService', 'groupService', function ($scope, User, Message, Notify, socket, friendRequestService, groupService) {
            // link to factory
            $scope.User = User;
            $scope.Message = Message;
            $scope.Notify = Notify;

            // isolated scope
            $scope.friendsNotInGroup = [];
            $scope.filtResult = [];
            $scope.filtName = '';
            $scope.addList = [];

            // isolated function
            //Friend
            $scope.unfriend = function () {
                if (!$scope.Message.receiverId || !$scope.Message.receiver || !$scope.Message.messageId || $scope.Message.receiverType != 'user') return;
                friendRequestService.unfriend({ userId: $scope.Message.receiverId, username: $scope.Message.receiver, messageId: $scope.Message.messageId }).then(function (response) {
                    if (response.data.isSuccess) {
                        $scope.Notify.notice('Done.', 'contentHeader');
                        $scope.Message.init();
                    }
                })
            }

            // Group
            $scope.getFriendsNotInGroup = function () {
                $scope.User.friendList.forEach(function (friend) {
                    var i = $scope.Message.memberList.findIndex(member => member.userId == friend.userId);
                    if (i == -1) {
                        $scope.friendsNotInGroup.push({
                            userId: friend.userId,
                            username: friend.username
                        })
                    }
                })
            }

            $scope.filtFriend = function () {
                $scope.filtResult = [];
                if ($scope.filtName) {
                    $scope.friendsNotInGroup.forEach(function (friend) {
                        if (friend.username.includes($scope.filtName)) {
                            $scope.filtResult.push(friend);
                        }
                    })
                }
            }

            $scope.changeList = function (username, userId) {
                var id = 'checkbox-' + username;
                if (document.getElementById(id).checked) {
                    $scope.addList.push({
                        username: username,
                        userId: userId
                    })
                } else {
                    var i = $scope.addList.findIndex(user => user.userId == userId);
                    if (i > -1) {
                        $scope.addList.splice(i, 1);
                    }
                }
            }

            $scope.addToGroup = function () {
                if (!$scope.addList) {
                    document.getElementById('addMemberInform').innerHTML = "Please select atleast a friend to add to this group.";
                } else {
                    groupService.addToGroup({
                        addList: $scope.addList,
                        groupId: $scope.Message.receiverId,
                        groupName: $scope.Message.receiver,
                        messageId: $scope.Message.messageId,
                        messageIndex: $scope.Message.messageCount
                    }).then(function (response) {
                        if (response.data.isSuccess) {
                            $scope.Notify.notice('Done.', 'contentHeader');
                            $scope.clear();
                        }
                    })
                }
            }

            $scope.leaveGroup = function () {
                if (!$scope.Message.receiverId || !$scope.Message.receiver || !$scope.Message.messageId || $scope.Message.receiverType != 'group') return;
                groupService.leaveGroup({
                    groupId: $scope.Message.receiverId,
                    groupName: $scope.Message.receiver,
                    messageId: $scope.Message.messageId,
                    numOfMem: $scope.Message.memberList.length,
                    messageIndex: $scope.Message.messageCount
                }).then(function (response) {
                    if (response.data.isSuccess) {
                        $scope.Notify.notice('Done.', 'contentHeader');
                        $scope.User.getContactList();
                        $scope.Message.init();
                    }
                })
            }

            $scope.clear = function () {
                $scope.friendsNotInGroup = [];
                $scope.filtResult = [];
                $scope.filtName = '';
                $scope.addList = [];

                document.getElementById('addMemberInform').innerHTML = '';
            }

            $scope.$on('clear', function(event, directive){
                if (directive == 'contentHeader'){
                    $scope.clear();
                }
            })

            // non-scope function

            // Handle socket event
            socket.on('unfriended', function (info) {
                $scope.Message.init();
                $scope.User.getContactList();
            })

            socket.on('be unfriended', function (info) {
                console.log("be unfriended")
                if (info.unfriend == $scope.Message.receiverId) {
                    $scope.Message.init();
                }
                $scope.User.getContactList();
            })

            socket.on('new member add to group', function (details) {
                socket.emit('join new group', details.messageId);
                if (details.userId == $scope.User.userId) $scope.User.getContactList();
                if (details.messageId == $scope.Message.messageId) {
                    $scope.Message.getMemberList();
                    $scope.Message.messageList.push(details.inform);
                    $scope.Message.lastSender = details.inform.sender;

                    socket.emit('received message', {
                        messageId: $scope.Message.messageId,
                        userId: $scope.User.userId,
                        username: $scope.User.username
                    })

                    var i = $scope.User.groupList.findIndex(group => group.messageId == details.messageId);
                    if (i > -1) {
                        if (details.inform.message.length > 30) details.inform.message = details.inform.message.slice(0, 29) + '...';
                        $scope.User.groupList[i].lastMessage = {
                            senderId: details.inform.senderId,
                            sender: details.inform.sender,
                            message: details.inform.message,
                            messageType: details.inform.messageType,
                            messageExt: details.inform.messageExt,
                            messageIndex: details.inform.messageIndex,
                            sent: details.inform.sent
                        };
                    }
                }
            })

            socket.on('someone leave group', function (details) {
                if ($scope.User.userId == details.userId) {
                    console.log('just leave')
                    $scope.User.getContactList();
                    socket.emit('leave group', details.messageId);
                }
                if ($scope.User.userId != details.userId && $scope.Message.messageId == details.messageId) {
                    $scope.Message.getMemberList();
                    $scope.Message.messageList.push(details.inform);
                    $scope.Message.lastSender = details.inform.sender;

                    socket.emit('received message', {
                        messageId: $scope.Message.messageId,
                        userId: $scope.User.userId,
                        username: $scope.User.username
                    })

                    var i = $scope.User.groupList.findIndex(group => group.messageId == details.messageId);
                    if (i > -1) {
                        if (details.inform.message.length > 30) details.inform.message = details.inform.message.slice(0, 29) + '...';
                        $scope.User.groupList[i].lastMessage = {
                            senderId: details.inform.senderId,
                            sender: details.inform.sender,
                            message: details.inform.message,
                            messageType: details.inform.messageType,
                            messageExt: details.inform.messageExt,
                            messageIndex: details.inform.messageIndex,
                            sent: details.inform.sent
                        };
                    }
                }
            })
        }],
    }
})