'use strict';

/**
 * The CardDataDirective displays attribute data using the column config meta data.
 *
 * The column config provides the order in which the attributes should get displayed, the label to be used,
 * as well as an optional custom renderer for custom rendering.
 *
 * Usage:
 *
 * <sp-card-data sp-data="identity" sp-col-configs="colConfigs" />
 *
 */
angular.module('sailpoint.directive').directive('spCardData', function() {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            spData: '=', // Data to display (usually AccessRequestItem or AccessRequestIdentity)
            spColConfigs: '=' // Array of column configs
        },
        controller: function() {
            this.isDisplayed = function(colConfig) {
                return colConfig.isDisplayed();
            };

            this.render = function(colConfig, data) {
                var cardDataValue, dataKey;

                if(!colConfig.isDisplayed()) {
                    throw 'Attempting to render non-displayed column config';
                }

                dataKey = colConfig.getDataIndex();

                // First check if we can use the object's accessor method.
                var funcName = 'get' + dataKey.charAt(0).toUpperCase() + dataKey.slice(1);
                if(angular.isFunction(data[funcName])) {
                    cardDataValue = data[funcName]();
                }

                // Next try to grab the property directly.
                if (!cardDataValue) {
                    cardDataValue = data[dataKey];
                }

                // Then see if it's on an 'attributes' child object
                if (!cardDataValue) {
                    if (data.attributes && data.hasOwnProperty('attributes')) {
                        cardDataValue = data.attributes[dataKey];
                    }
                }

                // Use the ColumnConfig to render the value
                return colConfig.renderValue(cardDataValue, data);
            };
        },
        controllerAs: 'cardDataCtrl',
        template: '<span ng-repeat="colConfig in spColConfigs | filter: cardDataCtrl.isDisplayed">' +
                    '<span class="sp-card-data-item" ng-if="cardDataCtrl.render(colConfig, spData)">' +
                      '<span class="sp-card-data-item-label"' +
                        '<b>{{colConfig.getLabel()}}#{msgs.ui_label_separator}</b>' +
                      '</span>' +
                      '<span class="sp-card-data-item-value" ng-bind-html="cardDataCtrl.render(colConfig, spData)">' +
                      '</span>' +
                    '</span>' +
                  '</span>',
        link: function(scope) {
            if(!scope.spColConfigs) {
                throw 'CardDataDirective must have column configs to work';
            }
        }
    };
});
