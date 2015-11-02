'use strict';

angular.module('sailpoint.reset')
    .factory('AuthAnswerModel', [function() {
        return SailPoint.userReset.AuthAnswer;
    }
    ]);