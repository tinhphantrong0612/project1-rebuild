chatApp.service('groupService', ['$http', function($http){
    return {
        createGroup: function(details){
            return $http.post('/group/createGroup', details);
        },
        addToGroup: function(details){
            return $http.post('/group/addToGroup', details);
        },
        leaveGroup: function(details){
            return $http.post('/group/leaveGroup', details);
        }
    }
}])