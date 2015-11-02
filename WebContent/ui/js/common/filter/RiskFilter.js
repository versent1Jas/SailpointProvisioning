/* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';

/**
 * Filter to render risk score with appropriate class
 *
 * Ex.
 * <p>{{ item.getRiskScore() | risk : item }}</p>
 */
angular.module('sailpoint.filter').
    filter('risk', function() {
        function getClass(score) {
            var className = '';
            if (score <= 167) {
                className = 'risk-lowest';
            } else if (score > 167 && score <= 333) {
                className = 'risk-low';
            } else if (score > 333 && score <= 500) {
                className = 'risk-medium-low';
            } else if (score > 500 && score <= 667) {
                className = 'risk-medium-high';
            } else if (score > 667 && score <= 833) {
                className = 'risk-high';
            } else if (score > 833) {
                className = 'risk-highest';
            }
            return className;
        }

        return function(value) {
            if (angular.isNumber(value)) {
                return '<span class="label risk ' + getClass(value) +'">' +
                    value + '</span>';
            } else {
                return value;
            }
        };
    });
