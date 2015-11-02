/**
 * Directive extension for the angularui popover directive to allow for additional triggers, blur and ESC key.
 */
angular.module('sailpoint.widget').
    config(function($provide) {
        $provide.decorator('popoverDirective', [ '$delegate', '$window', function($delegate, $window) {
            var directive = $delegate[0],
                compile = directive.compile;

            // redefine compile
            directive.compile = function() {
                // run compile which returns link function
                var link = compile.apply(this, arguments),
                    ios = $window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;

                return function(scope, element, attrs) {
                    // run link function of original popover directive
                    link.apply(this, arguments);

                    $(element).blur(function() {
                        // when button loses focus trigger click to toggle the popover
                        if ($(element).next('div.popover').length) {
                            $(element).click();

                            // if ios remove the backdrop div
                            if (ios && $('#iosbackdrop').length) {
                                $('#iosbackdrop').remove();
                            }
                        }
                    });

                    $(element).on('click', function() {
                        // add ios backdrop click div for ios when showing popover
                        if (ios && !$(element).next('div.popover').length) {
                            $('<div id="iosbackdrop" onclick="void(0);" ontouchend="$(\'#' +
                                $(element)[0].id + '\').blur();"/>').appendTo('body');
                        }
                    });

                    if(attrs.spPopoverHover) {
                        $(element).on('mouseenter', function() {
                            // Don't click if it's already there (from a previous click for example)
                            if (!$(element).next('div.popover').length) {
                                $(element).click();
                            }
                        });
                        $(element).on('mouseleave', function() {
                            if ($(element).next('div.popover').length) {
                                $(element).click();

                                // if ios remove the backdrop div
                                if (ios && $('#iosbackdrop').length) {
                                    $('#iosbackdrop').remove();
                                }
                            }
                        });
                    }

                    function togglePopoverEsc(e) {
                        if (e.keyCode === 27 && $(element).next('div.popover').length) {
                            $(element).click();
                        }
                    }

                    // listen to esc key
                    $(document).keyup(togglePopoverEsc);

                    scope.$on('$destroy', function(event){
                        //unbind the ESC keyup event handler
                        $(document).off('keyup', togglePopoverEsc);
                        //unbind the blur event handler
                        $(element).off('blur');
                    });
                };
            };

            return $delegate;
        }]);
    });

/**
 * Override popover template. Allow for html title and content.
 */
angular.module('template/popover/popover.html', []).
    filter('unsafe', ['$sce', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    }]).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('template/popover/popover.html',
            '<div role="dialog" aria-live="polite"' +
            ' class=\"popover {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n' +
            '  <div class=\"arrow\"></div>\n' +
            '\n' +
            '  <div class=\"popover-inner\">\n' +
            '      <h3 class=\"popover-title\" ng-bind-html=\"title | unsafe\" ng-show=\"title\"></h3>\n' +
            '      <div class=\"popover-content\" ng-bind-html=\"content | unsafe\"></div>\n' +
            '  </div>\n' +
            '</div>\n' +
            '');
    }]);
