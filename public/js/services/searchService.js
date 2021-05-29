chatApp.service('searchService', ['$http', function($http){
    return {
        searchUser: function(searchName){
            return $http.get('/user/search/' + searchName);
        }
    }
}])