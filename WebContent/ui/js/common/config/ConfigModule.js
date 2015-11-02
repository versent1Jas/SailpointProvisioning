'use strict';

/**
 * The config module
 */
angular.module('sailpoint.config', []).
    constant('SP_CONTEXT_PATH', SailPoint.CONTEXT_PATH || '');
