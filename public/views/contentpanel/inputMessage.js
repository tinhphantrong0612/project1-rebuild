chatApp.directive('inputMessage', function () {
    return {
        restrict: 'E',
        tranclude: true,
        templateUrl: 'views/contentpanel/inputMessage.html',
        scope: {},
        controller: ['$scope','$rootScope', 'User', 'Message', 'Notify', 'socket', function ($scope, $rootScope, User, Message, Notify, socket) {
        // Link to factory
            $scope.User = User;
            $scope.Message = Message;
            $scope.Notify = Notify;

        // Isolated scope variable
            $scope.message = '';
            $scope.selectedFileList = [];
            $scope.inform = '';
            $scope.selectedAvatar;

        // Non-scope variable
            var reader = new FileReader();
            var fileChooser = document.getElementById('fileChooser');
            // var avatarChooser = document.getElementById('avatarChooser');
            var selectedFileDisplay = document.getElementById('selectedFileDisplay');
            // var tempAvatarLink = '';

            // Isolated scope function
            $scope.fileChooserTrigger = function () {
                if (!$scope.Message.receiver) return;
                selectedFileDisplay.innerHTML = '';
                fileChooser.innerHTML = '';
                $scope.selectedFileList = [];
                angular.element(fileChooser).trigger('click');
            }

            // $scope.avatarChooserTrigger = function() {
            //     if (!$scope.User) return;
            //     avatarChooser.innerHTML = '';
            //     $scope.selectedAvatar = null;
            //     angular.element(avatarChooser).trigger('click');
            // }

            $scope.send = function () {
                if (!$scope.selectedFileList || $scope.selectedFileList.length) {
                    var fileType = '';
                    if ($scope.selectedFileList[0].type.startsWith('image/')) {
                        fileType = 'image';
                    } else if ($scope.selectedFileList[0].type.startsWith('video/')) {
                        fileType = 'video';
                    } else {
                        fileType = 'attachment';
                    }

                    socket.emit('file message', {
                        senderId: $scope.User.userId,
                        sender: $scope.User.username,
                        sender: $scope.User.username,
                        receiverId: $scope.Message.receiverId,
                        receiver: $scope.Message.receiver,
                        receiverType: $scope.Message.receiverType,
                        messageId: $scope.Message.messageId,
                        message: $scope.selectedFileList[0].name,
                        messageType: fileType,
                        messageExt: $scope.selectedFileList[0].name.split('.').pop(),
                        messageIndex: $scope.Message.messageCount,
                        data: reader.result,
                        sent: Date.now()
                    })
                    reader.readAsArrayBuffer($scope.selectedFileList[0]);
                    $scope.selectedFileList = [];
                    fileChooser.value = null;
                    document.getElementById('selectedFileDisplay').innerHTML = '';
                }

                if (!$scope.message || !$scope.Message.receiverId || !$scope.Message.messageId) {
                    return;
                } else {
                    socket.emit('text message', {
                        senderId: $scope.User.userId,
                        sender: $scope.User.username,
                        receiverId: $scope.Message.receiverId,
                        receiver: $scope.Message.receiver,
                        receiverType: $scope.Message.receiverType,
                        messageId: $scope.Message.messageId,
                        message: $scope.message,
                        messageType: 'text',
                        messageExt: '',
                        messageIndex: $scope.Message.messageCount,
                        sent: Date.now()
                    })
                    $scope.message = '';
                }
            }

            // $scope.changeAvatar = function(){

            // }

            $scope.clearNotify = function(){
                $rootScope.$broadcast('clear', $scope.Notify.directive);
                $scope.Notify.note = '';
                $scope.Notify.directive = '';
            }

            // $scope.clearAvatar = function(){
            //     URL.revokeObjectURL(tempAvatarLink);
            //     tempAvatarLink = '';
            //     $scope.selectedAvatar = null;
            // }

            $scope.clear = function(){
                $scope.selectedFileList = null;
                fileChooser.value = null;
                document.getElementById('selectedFileDisplay').innerHTML = '';
            }

            $scope.$on('clear', function(event, directive){
                if (directive == 'inputMessage'){
                    $scope.clear();
                }
            })

        // Non-scope function
            fileChooser.addEventListener('change', function () {
                $scope.selectedFileList = this.files;
                if (!$scope.selectedFileList.length) return;
                if ($scope.selectedFileList[0].size > 10000000) {
                    console.log($scope.selectedFileList[0].size)
                    jQuery.noConflict();
                    $scope.Notify.note = "File size must not exceed 10MB.";
                    $scope.Notify.notice("File size must not exceed 10MB.", "inputMessage");
                    return;
                }
                reader.readAsArrayBuffer($scope.selectedFileList[0]);
                if ($scope.selectedFileList[0].type.startsWith('image/')) {
                    var div = document.createElement('div');
                    div.classList.add('p-1')
                    var img = document.createElement('img');
                    var closeButton = document.createElement('button');
                    var timeSpan = document.createElement('span');
                    var fileName = document.createElement('div');
                    div.classList.add('small-img-cont');
                    img.classList.add('small-img');
                    closeButton.classList.add('close', 'close-button');
                    timeSpan.innerHTML = '&times;'
                    img.src = URL.createObjectURL($scope.selectedFileList[0]);
                    img.onload = function () {
                        URL.revokeObjectURL(this.src);
                    }
                    fileName.innerHTML = $scope.selectedFileList[0].name;
                    fileName.classList.add('file-name', 'pr-1', 'pl-1', 'pb-1');
                    selectedFileDisplay.appendChild(div);
                    selectedFileDisplay.appendChild(fileName);
                    div.appendChild(img);
                    div.appendChild(closeButton);
                    closeButton.appendChild(timeSpan);
                    closeButton.onclick = function () {
                        $scope.clear();
                    }
                } else if ($scope.selectedFileList[0].type.startsWith('video/')) {
                    var div = document.createElement('div');
                    div.classList.add('p-1')
                    var video = document.createElement('video');
                    var closeButton = document.createElement('button');
                    var timeSpan = document.createElement('span');
                    var fileName = document.createElement('div');
                    div.classList.add('small-img-cont');
                    video.classList.add('small-img');
                    closeButton.classList.add('close', 'close-button');
                    timeSpan.innerHTML = '&times;'
                    video.src = URL.createObjectURL($scope.selectedFileList[0]);
                    video.onload = function () {
                        URL.revokeObjectURL(this.src);
                    }
                    fileName.innerHTML = $scope.selectedFileList[0].name;
                    fileName.classList.add('file-name', 'pr-1', 'pl-1', 'pb-1');
                    selectedFileDisplay.appendChild(div);
                    selectedFileDisplay.appendChild(fileName);
                    div.appendChild(video);
                    div.appendChild(closeButton);
                    closeButton.appendChild(timeSpan);
                    closeButton.onclick = function () {
                        $scope.clear();
                    }
                } else {
                    var div = document.createElement('div');
                    div.classList.add('p-1')
                    var img = document.createElement('img');
                    var closeButton = document.createElement('button');
                    var timeSpan = document.createElement('span');
                    var fileName = document.createElement('div');
                    div.classList.add('small-img-cont');
                    img.classList.add('small-img');
                    closeButton.classList.add('close', 'close-button');
                    timeSpan.innerHTML = '&times;'
                    img.src = '/../img/document_generic.png';
                    fileName.innerHTML = $scope.selectedFileList[0].name;
                    fileName.classList.add('file-name', 'pr-1', 'pl-1', 'pb-1');
                    document.getElementById('selectedFileDisplay').appendChild(div);
                    document.getElementById('selectedFileDisplay').appendChild(fileName);
                    div.appendChild(img);
                    div.appendChild(closeButton);
                    closeButton.appendChild(timeSpan);
                    closeButton.onclick = function () {
                        $scope.clear();
                    }
                }
            })

            // avatarChooser.addEventListener('change', function(){
            //     if (!this.files) return;
            //     else {
            //         $scope.selectedAvatar = this.files[0];
            //         reader.readAsArrayBuffer($scope.selectedAvatar);
            //         var avatar = document.getElementById('user-info-avatar');
            //         tempAvatarLink = URL.createObjectURL($scope.selectedAvatar);
            //         console.log(tempAvatarLink)
            //         avatar.src = tempAvatarLink;
            //     }
            // })

            // changeSrc = function(event, image){
            //     if (event == 'mouseover'){
            //         image.src = '../img/avatar/change-avatar.png'
            //     } else if (event == 'mouseout'){
            //         if (tempAvatarLink) image.src = tempAvatarLink;
            //         else image.src = '../img/avatar/{{User.username}}.png'
            //     }
            // }
        }],
    }
})