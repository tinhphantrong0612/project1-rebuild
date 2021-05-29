chatApp.directive('mySettings', function () {
    return {
        restrict: 'E',
        templateUrl: 'views/sidepanel/mySettings.html',
        scope: {},
        controller: ['$scope', '$cookies', '$location', '$http', function mySettingsController($scope, $cookies, $location, $http) {
            $scope.logOut = function () {
                $cookies.remove('userId');
                $http.post('/auth/logout').then(function(response){
                    if (response.data.isSuccess){
                        $location.url('/login');
                    }
                });
            }
        }]
    }
})