chatApp.directive('singleMessage', ['$timeout', 'socket', function($timeout, socket){
    return {
        restrict: 'E',
        tranclude: true,
        templateUrl: 'views/contentpanel/singleMessage.html',
        scope: {
            message: '=',
            userId: '=',
            userName: '=',
            messageId: '=',
            messageCount: '='
        },
        compile: function(scope, element, attr){
            return {
                pre: function preLink(scope, element, attr){
                    if (scope.message.messageType == 'link' && !scope.message.title){
                        socket.emit('get link details', {
                            message: scope.message,
                            messageId: scope.messageId
                        });
                    }
                },
                post: function postLink(scope, element, attr){
                    $timeout(function(){
                        if (scope.message.messageIndex == scope.messageCount - 1){
                            scope.$emit('rendered', scope.message.messageIndex);
                        }
                    })
                }
            }
        }
    }
}])