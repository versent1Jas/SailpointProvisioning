/**
 * This directive is responsible for showing an alert notification.
 *
 * A separate div with id 'notificationDiv' is required to be on the same page as the directive for jaws to read the
 * notification.
 *
 * <div id="notificationDiv" class="sr-only" role="alert" aria-live="rude"></div>
 *
 * When this div is included in the directive template JAWS doesn't read it. It looks like it needs to be on the page
 * when originally rendered.
 */
'use strict';
angular.module('sailpoint.directive').
    directive('spNotification', ['spNotificationService', '$sniffer', '$compile',
        function (spNotificationService, $sniffer, $compile) {

            /**
             * Takes the array of passed in args and creates the string to get them into the translate filter
             * @param args Array[Object]
             * @returns {string} The template string
             */
            function getTemplate(args) {
                var argString = '';
                if (args) {
                    argString = ': ' + args.join(':');
                }

                var template = '<div ng-show="showMessage()" class="alert-box">' +
                    '<div aria-hidden="true" ng-class="getAlertClass()" class="alert text-center animated fadeOutUp">' +
                    '<h5 ng-if="messageOrKey">' +
                    '<i ng-class="getIconClass()" class="fa m-r-sm"></i>' +
                    '{{ messageOrKey | spTranslate ' + argString + '}}' +
                    '</h5>' +
                    '</div></div>';
                return template;
            }

            /**
             * Returns a simplified screen reader-friendly message for the notification
             * div.  We use this so the screen reader will announce the value of the message
             * @param args
             * @return {string}
             */
            function getJawsTemplate(args) {
                var argString = '';
                if (args) {
                    argString = ': ' + args.join(':');
                }
                return '<p role="alert">{{ messageOrKey | spTranslate ' +
                    argString + '}}</p>';

            }

            return {
                restrict: 'E',
                replace: true,
                link: function (scope, element) {

                    var notification = spNotificationService.getNotification();

                    if (notification) {
                        scope.messageOrKey = notification.messageOrKey;
                        scope.status = notification.status;
                        scope.args = notification.args;
                    }
                    else {
                        scope.messageOrKey = null;
                        scope.status = null;
                        scope.args = null;
                    }

                    scope.showMessage = function () {
                        return scope.messageOrKey !== null;
                    };

                    scope.getAlertClass = function () {
                        var alertClass = 'alert-success text-success';
                        if (scope.status === spNotificationService.ERROR) {
                            alertClass = 'alert-danger';
                        }
                        else if (scope.status === spNotificationService.WARNING) {
                            alertClass = 'alert-warning';
                        }
                        else if (scope.status === spNotificationService.INFO) {
                            alertClass = 'alert-info';
                        }
                        return alertClass;
                    };

                    scope.getIconClass = function () {
                        var iconClass = 'fa-check';
                        if (scope.status === spNotificationService.ERROR) {
                            iconClass = 'fa-exclamation-triangle';
                        }
                        else if (scope.status === spNotificationService.WARNING) {
                            iconClass = 'fa-exclamation-circle';
                        }
                        else if (scope.status === spNotificationService.INFO) {
                            iconClass = 'fa-info-circle';
                        }
                        return iconClass;
                    };

                    // if CSS3 animations is not supported fallback to jquery animation
                    if (!$sniffer.animations) {
                        var elm = $('.animated.fadeOutUp');
                        if (elm.length > 0) {
                            setTimeout(function () {
                                $(elm[0]).animate({ height: 'toggle', opacity: 'toggle' }, 3000);
                            }, 3000);
                        }
                    }

                    // set the sr-only div for jaws to read
                    if ($('#notificationDiv').length > 0 && scope.messageOrKey) {
                        $('#notificationDiv').html($compile(getJawsTemplate(scope.args))(scope));
                    }

                    spNotificationService.clear();
                    var el = $compile(getTemplate(scope.args))(scope);
                    element.append(el);
                }
            };
        }]);
