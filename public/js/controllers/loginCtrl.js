chatApp.controller('LoginController', ['$scope', '$location', '$cookies', 'Authorization', function($scope, $location, $cookies, Authorization){
    var vm = {
        username: '',
        password: ''
    };

    vm.login = function(){
        if (vm.username == '' || vm.password == ''){
            document.getElementById('inform').innerHTML = "Enter all username and password.";
        }
        Authorization.login({username: vm.username, password: vm.password}).then(function(response){
            if (response.data.isSuccess){
                var today = new Date();
                var expireDate = new Date(today);
                expireDate.setMinutes(today.getMinutes + 30)
                $cookies.put('userId', response.data.userId, {'expires': expireDate});
                $location.url('/');
            } else {
                document.getElementById('inform').innerHTML = "Wrong username or password.";
            }
        })
    }

    $scope.vm = vm;
}])