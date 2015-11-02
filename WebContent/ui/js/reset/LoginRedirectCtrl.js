/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Controller that redirects to the login page in the event that a path was incorrect. It's a
 * real shame that we even had to create this controller.  Reason being that the reset module lives outside
 * the scope of the login page, we can not redirect using $location.path() as angular will append #/login.jsf
 * to the reset.jsf page.
 * Project: identityiq
 * Author: chris.annino
 * Created: 2/21/14
 */
angular.module('sailpoint.reset')
    .controller('LoginRedirectCtrl', ['$window', 'SP_CONTEXT_PATH',
        function ($window, SP_CONTEXT_PATH) {
            var loc = $window.location,
                newURL = loc.protocol + '//' + loc.host + SP_CONTEXT_PATH + '/login.jsf';
            // replace the browser history, don't go back to the bad path
            loc.replace(newURL);
        }
    ]);