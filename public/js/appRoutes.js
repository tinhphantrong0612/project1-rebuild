chatApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
    $routeProvider.when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginController'
    }).when('/register', {
        templateUrl: 'views/register.html',
        controller: 'RegisterController'
    }).when('/', {
        templateUrl: 'views/msg.html',
        controller: 'MsgController'
    }).otherwise('/login');

    $locationProvider.html5Mode({
        enable: true,
        requireBase: true
    });
}])