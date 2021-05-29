chatApp.factory('Notify', function(){
    var Notify = {
        note: "File size must not exceed 10MB.",
        directive: ""
    };

    Notify.notice = function(note, directive){
        Notify.note = note;
        Notify.directive = directive;
        angular.element(document.getElementById('notify')).modal('show');
    }

    return Notify;
})