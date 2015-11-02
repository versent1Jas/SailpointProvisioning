/**
 * Filter to translate work item priority
 */
angular.module('sailpoint.approval').
    filter('priority', function() {
        // So as to not need to duplicate the priority keys we are
        // using the jsf translations
        var translationMatrix = {
            'High': '#{msgs.work_item_level_high}',
            'Normal': '#{msgs.work_item_level_normal}',
            'Low': '#{msgs.work_item_level_low}'
        };
        return function(priority) {
            if(!priority) {
                priority = 'Normal';
            }
            return translationMatrix[priority];
        };
    });
