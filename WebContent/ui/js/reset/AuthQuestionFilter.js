'use strict';

angular.module('sailpoint.reset').filter('AuthQuestionFilter', function() {
    return function(questions, index, answers) {
        var filtered = [];
        angular.forEach(questions, function(q) {
            //may want to add index to answer model
            var i;
            var duplicate = false;
            if (answers && answers.length > 0) {
                for (i = 0; i < answers.length; i++) {
                    if (answers[i].id === q.id && i !== index) {
                        duplicate = true;
                        break;
                    }
                }
            }
            if(duplicate === false) {
                filtered.push(q);
            }

        });
        return filtered;
    };
});