var chatApp = angular.module('app', ['ngRoute', 'ngCookies']).run(['$cookies', '$location', '$rootScope', function($cookies, $location, $rootScope){
    $rootScope.$on('$locationChangeStart', function(event, next, current){
        var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
        var loggedIn = $cookies.get('userId');
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            } else if (loggedIn) {
                $location.path('/');
            }
    })
}])