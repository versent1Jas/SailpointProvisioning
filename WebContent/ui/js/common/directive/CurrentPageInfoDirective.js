/**
 * A directive that implements the showing x-y of z ui element.
 *  x is the one based index of the first item displayed
 *  y is the one based index of the last item displayed
 *  z is the total number of items
 *
 * This directive takes as a model an instance PagingData
 */
'use strict';
angular.module('sailpoint.directive').
    directive('spCurrentPageInfo', ['spTranslateFilter', function (spTranslateFilter) {
        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {
                pagingData: '=ngModel'
            },
            link: function(scope) {
                /* Add helper functions to isolated scope */
                /**
                 * First item is (currentPage - 1) * itemsPerPage + 1
                 * @returns {number} One based index of first item on the page
                 */
                scope.currentPageStart = function() {
                    var pagingData = scope.pagingData;
                    return pagingData.itemsPerPage * (pagingData.currentPage - 1) + 1;
                };
                /**
                 * Last item is the minimum of firstItem + itemsPerPage - 1 and total
                 * @returns {number} One based index of the last item on the page
                 */
                scope.currentPageEnd = function() {
                    var start = scope.currentPageStart(),
                        pagingData = scope.pagingData;
                    return Math.min(start + pagingData.itemsPerPage - 1, pagingData.getTotal());
                };
                
                scope.getText = function() {
                    return spTranslateFilter('ui_access_showing_blank_through_blank_of_blank',
                        scope.currentPageStart(),
                        scope.currentPageEnd(),
                        scope.pagingData.getTotal());
                };
            },
            template: '<div class="text-center results" aria-label="{{getText()}}">' +
                        '<span class="text-muted h5 font-thin">' +
                        '  {{getText()}}' +
                        '</span>' +
                      '</div>'
        };
    }]);
