/**
 * Filter add new account string to operation if necessary.
 * 
 * Inputs-
 * Value- the operation string to modify
 * indicator- object with isNewAccount property or boolean with true/false value
 * 
 * Usage
 * operationFilter('Add',false);
 * {{'Add' | operation : false}}
 * 
 */
angular.module('sailpoint.filter').
    filter('operation', ['spTranslateFilter', function(spTranslateFilter) {
        return function(value, indicator) {
            // indicator should be object with isNewAccount property or boolean with true/false value
            if((typeof indicator === 'object' && indicator.isNewAccount) || indicator === true) {
                return value + ' ' + spTranslateFilter('ui_my_approvals_new_account_requested');
            }
            return value;
        };
    }]);