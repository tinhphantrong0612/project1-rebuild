chatApp.service('friendRequestService', ['$http', function($http){
    return {
        sendFriendRequest: function(details){
            return $http.post('/friendRequest/send', details);
        },
        cancelFriendRequest: function(details){
            return $http.post('/friendRequest/cancel', details);
        },
        acceptFriendRequest: function(details){
            return $http.post('/friendRequest/accept', details);
        },
        declineFriendRequest: function(details){
            return $http.post('/friendRequest/decline', details);
        },
        unfriend: function(details){
            return $http.post('/friendRequest/unfriend', details);
        }
    }
}])