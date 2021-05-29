chatApp.service('Authorization', ['$http', function($http){
    return {
        login: function(details){
            return $http.post('/auth/login', details);
        },
        register: function(details){
            return $http.post('/auth/register', details);
        }
    }
}]);