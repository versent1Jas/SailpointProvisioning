/**
 * This directive removes focus from the current field and moves it
 * to the field specified by the passed selector when the enter key
 * is pressed or optionally when clicked.
 *
 * <input type="text" sp-focus-changer="#searchBtn" sp-focus-changer-click="true"/>
 * <button id="searchButton">Search</button>
 */
angular.module('sailpoint.directive').
    directive('spFocusChanger', function () {
        return {
            link: function(scope, element, attrs) {
                var nextElement = angular.element(attrs['spFocusChanger']),
                    focusOnClick = attrs['spFocusChangerClick'];
                element.bind('keyup', function(keyEvent) {
                    if(keyEvent.keyCode !== 13) {
                        return;
                    }
                    nextElement.focus();
                });
                if (focusOnClick) {
                    element.bind('click', function() {
                        nextElement.focus();
                    });
                }
            }
        };
    });