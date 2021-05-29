chatApp.directive('addContact', function () {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'views/sidepanel/addContact.html',
        scope: {},
        controller: ['$scope', 'User', 'Notify', 'friendRequestService', 'searchService', 'groupService', 'socket', function ($scope, User, Notify, friendRequestService, searchService, groupService, socket) {
            // global model using factory
            $scope.User = User;
            $scope.Notify = Notify;

            // Isolate scope
            $scope.searchResult = [];
            $scope.searchName = '';
            $scope.requestUserId = '';
            $scope.requestUser = '';
            $scope.newGroupName = '';

            // Isolate scope function
            $scope.searchUser = function () {
                if (!$scope.searchName) {
                    $scope.searchResult = [];
                    return;
                } else {
                    searchService.searchUser($scope.searchName).then(function (response) {
                        $scope.searchResult = response.data.searchResult;
                    })
                }
            }

            $scope.sendFriendRequest = function (id, username) {
                var i = $scope.User.sentFriendRequests.findIndex(user => user.userId == id);
                var ii = $scope.User.receivedFriendRequests.findIndex(user => user.userId == id);
                var iii = $scope.User.friendList.findIndex(user => user.userId == id);
                if (i > -1) {
                    $scope.requestUser = username;
                    $scope.requestUserId = id;
                    jQuery.noConflict();
                    angular.element(document.getElementById('notifySent')).modal('show');
                    return;
                } else if (ii > -1) {
                    $scope.requestUser = username;
                    $scope.requestUserId = id;
                    jQuery.noConflict();
                    angular.element(document.getElementById('notifyReceived')).modal('show');
                    return;
                } else if (iii > -1) {
                    jQuery.noConflict();
                    $scope.Notify.notice("Friend Already.","addContact");
                    return;
                } else {
                    friendRequestService.sendFriendRequest({ userId: id, username: username }).then(function (response) {
                        if (response.data.isSuccess) {
                            jQuery.noConflict();
                            $scope.Notify.notice("Friend Request Sent.", "addContact");
                            return;
                        }
                    })
                }
            }

            $scope.cancelFriendRequest = function (id, username) {
                friendRequestService.cancelFriendRequest({ userId: id, username: username }).then(function (response) {
                    if (response.data.isSuccess) {
                        jQuery.noConflict();
                        $scope.Notify.notice("Friend Request Canceled.", "addContact");
                        return;
                    }
                })
            }

            $scope.acceptFriendRequest = function (id, username) {
                friendRequestService.acceptFriendRequest({ userId: id, username: username }).then(function (response) {
                    if (response.data.isSuccess) {
                        jQuery.noConflict();
                        $scope.Notify.notice("Accepted.", "addContact");
                        return;
                    }
                })
            }

            $scope.declineFriendRequest = function (id, username) {
                friendRequestService.declineFriendRequest({ userId: id, username: username }).then(function (response) {
                    if (response.data.isSuccess) {
                        jQuery.noConflict();
                        $scope.Notify.notice("Declined.", "addContact");
                        return;
                    }
                })
            }

            $scope.createGroup = function () {
                if (!$scope.newGroupName) {
                    document.getElementById('createGroupInform').innerHTML = 'Please input group name.'
                } else {
                    groupService.createGroup({ groupName: $scope.newGroupName }).then(function (response) {
                        if (response.data.isSuccess) {
                            angular.element(document.getElementById('createGroup')).modal('hide');
                            $scope.Notify.notice('Created.', 'addContact');
                            socket.emit('join new group', response.data.messageId);
                        } else {
                            console.log(response);
                        }
                    })
                }
            }

            // non-scope function
            $scope.clear = function () {
                $scope.searchResult = [];
                $scope.searchName = '';
                $scope.requestUser = '';
                $scope.requestUserId = '';
                $scope.newGroupName = '';

                document.getElementById('createGroupInform').innerHTML = '';
            }

            $scope.$on('clear', function(event, directive){
                if (directive == 'addContact'){
                    $scope.clear();
                }
            })

            socket.on('friend request change', function () {
                $scope.User.getFriendRequests();
            })

            socket.on('contact list change', function () {
                $scope.User.getContactList();
                $scope.User.getFriendRequests();
            })
        }],
    }
})