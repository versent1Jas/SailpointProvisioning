/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

var SailPoint = SailPoint || {};

/**
 * Define the notifications module.
 */
angular.module('sailpoint.notification', []).
    constant('SP_CONTEXT_PATH', SailPoint.CONTEXT_PATH || '');
