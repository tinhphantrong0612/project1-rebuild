chatApp.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:3000');

    return {
        id: function(){
            return socket.id
        },
        init: function(){
            if (socket.disconnected) socket = io.connect('http://localhost:3000');
        },
        disconnect: function(callback){
            socket.disconnect(function(){
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        connected: function(){
            return socket.connected;
        },
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data) {
            socket.emit(eventName, data);
        },
        removeAllListeners: function (eventName, callback) {
            socket.removeAllListeners(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        }
    };
});