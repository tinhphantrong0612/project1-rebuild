chatApp.directive('contactList', function () {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'views/sidepanel/contactList.html',
        scope: {},
        controller: ['$scope', 'User', 'Message', 'socket', function ($scope, User, Message, socket) {
            // Init global models
            $scope.User = User;
            $scope.Message = Message;

            // Declare isolated scope variable
            $scope.filtName = '';
            $scope.friendFiltResult = [];
            $scope.groupFiltResult = [];

            // Declare isolated scope function
            $scope.getMessage = function (id, name, type, messageId) {
                if ($scope.User.friendList.findIndex(friend => friend.userId == id) < 0 && $scope.User.groupList.findIndex(group => group.groupId == id) < 0) {
                    $scope.filtName = '';
                    $scope.friendFiltResult = [];
                    $scope.groupFiltResult = [];
                    return;
                }
                $scope.Message.getMessage(id, name, type, messageId);
            }

            $scope.filt = function () {
                $scope.friendFiltResult = [];
                $scope.groupFiltResult = [];
                if ($scope.filtName) {
                    $scope.User.friendList.forEach(function (friend) {
                        if (friend.username.includes($scope.filtName)) {
                            $scope.friendFiltResult.push(friend);
                        }
                    })

                    $scope.User.groupList.forEach(function (group) {
                        if (group.groupName.includes($scope.filtName)) {
                            $scope.groupFiltResult.push(group);
                        }
                    })
                }
            }

            socket.on('last message', function (lastMessage) {
                var i = $scope.User.friendList.findIndex(friend => friend.userId == lastMessage.friend);
                if (!lastMessage.lastMessage || i < 0 || !lastMessage.lastMessage.messageType) return;
                else if (lastMessage.lastMessage.messageType == 'text' && lastMessage.lastMessage.message.length > 30) {
                    lastMessage.lastMessage.message = lastMessage.lastMessage.message.slice(0, 29) + '...';
                    $scope.User.friendList[i].lastMessage = lastMessage.lastMessage;
                } else {
                    $scope.User.friendList[i].lastMessage = lastMessage.lastMessage;
                }
            })

            socket.on('group last message', function (lastMessage) {
                var i = $scope.User.groupList.findIndex(group => group.groupId == lastMessage.group);
                if (!lastMessage.lastMessage || i < 0 || !lastMessage.lastMessage.messageType) return;
                else if ((lastMessage.lastMessage.messageType == 'text' || lastMessage.lastMessage.messageType == 'inform') && lastMessage.lastMessage.message.length > 30) {
                    lastMessage.lastMessage.message = lastMessage.lastMessage.message.slice(0, 29) + '...';
                    $scope.User.groupList[i].lastMessage = lastMessage.lastMessage;
                } else {
                    $scope.User.groupList[i].lastMessage = lastMessage.lastMessage;
                }
            })
        }]
    }
})