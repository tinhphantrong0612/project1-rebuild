chatApp.controller('RegisterController', ['$scope', '$location', 'Authorization', function($scope, $location, Authorization){
    $scope.username = '';
    $scope.password = '';

    $scope.register = function(){
        Authorization.register({username: $scope.username, password: $scope.password}).then(function(response){
            if (response.data.isSuccess){
                document.getElementById('inform').innerHTML = 'Register successful.'
            } else {
                document.getElementById('inform').innerHTML = 'Username existed.'
            }
        })
    }
}])