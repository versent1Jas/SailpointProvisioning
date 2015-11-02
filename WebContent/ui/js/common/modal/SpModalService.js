'use strict';

/**
 * A service that can display a modal dialog with a title and some content.
 */
/* jshint maxparams: 10 */
angular.module('sailpoint.modal').
    factory('spModal', ['$rootScope', '$http', '$q', '$compile', '$modal', '$document', '$window', '$timeout',
        '$location', 'browserSniffer',
        function($rootScope, $http, $q, $compile, $modal, $document, $window, $timeout, $location, browserSniffer) {

            // Service to return
            var service = {
                modals : []
            };

            var TYPE_ALERT = 'alert',
                TEMPLATE_DIALOG = 'util/modal-dialog.html',
                TEMPLATE_ALERT = 'util/modal-alert.html';

            /**
             * Removes the current modal window from the array so closeAll doesn't barf when trying to
             * close a dismissed window.
             *
             * @param service The spModal service
             */
            function removeModal(service, modal) {
                if(service && service.modals) {
                    var index = service.modals.indexOf(modal);
                    if(index > -1) {
                        service.modals.splice(index, 1);
                    }
                }
            }

            /**
             * Validates and initializes values from the config
             *
             * @param config Object to validate
             */
            function validateConfig(config) {
                if (config.template) {
                    throw 'Does not support template';
                }
                if (!config.title) {
                    throw 'Title is required';
                }
                if (!config.content && !config.templateUrl) {
                    throw 'Content or templateUrl must be specified';
                }
                // If scope is not defined create one
                config.scope = config.scope || $rootScope.$new();
                // Make sure we have an id.
                config.id = config.id || 'infoModal';
                // initialize to empty list if not provided
                config.buttons = config.buttons || [];

                /* Do conversions on the dialog warningLevels if this is an alert modal*/
                if(config.type === TYPE_ALERT) {
                    if(config.warningLevel === 'warning') {
                        config.warningLevel = 'warn';
                    }
                    if(config.warningLevel === 'error') {
                        config.warningLevel = 'danger';
                    }
                }
            }

            /**
             * Uses values from the config to populate the scope, that is also on the config
             * @param config Object with properties we want to add to the scope
             */
            function configureScope(config) {
                var scope = config.scope;
                // Populate the modal's scope with values from the config
                scope.title = config.title;
                scope.dialogId = config.id;
                scope.warningLevel = config.warningLevel || 'info';
                scope.isContextual = config.isContextual;
                scope.buttons = config.buttons;
                // shuffle around passed template and our template
                scope.contentTemplateUrl = config.templateUrl;
                scope.footerTemplateUrl = config.footerTemplateUrl;
                scope.content = config.content;
                /* check if button is disabled, based on optional
                 * button.disabled property */
                scope.isButtonDisabled = function(button) {
                    var disabled = false;
                    if (button.disabled) {
                        disabled = scope.$eval(button.disabled);
                    }
                    return disabled || scope.inProgress;
                };
                
                scope.doButtonAction = function (button) {
                    var deferred,
                        promise,
                        closeFunc;
                    scope.inProgress = true;
                    if (button.action) {
                        promise = $q.when(button.action.apply(this));
                    } else {
                        deferred = $q.defer();
                        deferred.resolve();
                        promise = deferred.promise;
                    }

                    if (button.close) {
                        closeFunc = this.$close;
                        var inProgress = angular.element(document.getElementById('inProgress'));
                        inProgress.trigger('focus');
                    } else {
                        closeFunc = this.$dismiss;
                    }

                    promise.then(function (result) {
                        closeFunc(result);
                    })['finally'](function () {
                        scope.inProgress = false;
                    });
                    
                };
            }

            /**
             * @description
             * Animating the element off the screen does not remove it from the dom immediately.
             * Ensure that an element is visible either by :visible or it does not have a parent
             * that has opacity zero.
             * This does not work in IE9 and is a bit hit or miss in FF.  It works in more cases
             * than the code it replaced, but is far from perfect.
             * @param element HTML element to determine if it is visible or not
             * @return {boolean} True if visible otherwise false
             */
            function isVisible(element) {
                var angElement = angular.element(element),
                    visible = angElement.is(':visible'),
                    invisibleParents = angElement.parents().filter(function() {
                        return angular.element(this).css('opacity') === '0';
                    });
                return visible && invisibleParents.length === 0;
            }

            /**
             * @description
             * Wraps $modal.open to apply all the default decorations
             * @param config a configuration object with the following options
             *  - title - required - title or message key of title
             *  - content - optional-ish - the content to be put into the dialog.  Can be a string or html.  Values
             *      will not be interpolated.  One of content or templateUrl must be defined
             *  - templateUrl - optional-ish - The url of the template to be put into the dialog.  One of content
             *      or templateUrl must be defined.  TemplateUrl will be ngIncluded into the modal's form.  That will
             *      introduce a new scope.  Bear this in mind when including a form in your template or adding things
             *      to the scope in nested controllers.
             *  - footerTemplateUrl- optional - if you want to prepend to the footer before the buttons set an
             *      url here.
             *  - type - optional - if set to "alert" it will use the alert template which is a simple alert modal box
             *  that is styled based on what is passed in on warningLevel
             *  - dialogId - optional - the id for the dialog defaults to 'infoModal'
             *  - autoFocus - optional - if set to true, the close button is autofocused when the dialog opens.
             *  - warningLevel - optional - info, warning, danger, or success.  If not specified defaults to info
             *  - isContextual - optional - Default false.  If true and an info warningLevel the info icon will be
             *      rendered.  The icon is always rendered for warningLevels 'warning', 'danger', and 'success'.
             *  If specified the content is wrapped in either the error or warning bubble
             *  - buttons - optional - an array of button configs with the following options
             *      - displayValue - value displayed on button or messagekey
             *      - action - Function will be applied to the scope when the button is clicked.  Function should
             *          return a promise that resolves if the dialog should be closed/dismissed  or is rejected. If a
             *          promise isn't returned, we will resolve automatically. 
             *      - close - boolean. if true the dialog will be closed after invoking action otherwise the dialog
             *          will be dismissed
             *      - primary - if the button will have the primary style
             *      - extraClass - string of extra classes to add to the button
             *      - disabled - expression to evaluate to determine if button is disabled or not
             * @returns {*} The result of $modal.open with a setTitle method added
             */
            service.open = function(config) {
                var activeElement = $document[0].activeElement,
                    modal;
                function handleModalClose() {
                    // Using $timeout to perform focus adjustment asynchronously
                    $timeout(function() {
                        if(isVisible(activeElement)) {
                            activeElement.focus();
                        } else {
                            $window.focus();
                        }
                    });
                    removeModal(service, modal);
                }
                validateConfig(config);
                configureScope(config);
                // Use the dialog template for all modals unless the type is set to 'alert'
                config.templateUrl = TEMPLATE_DIALOG;
                if(config.type === TYPE_ALERT) {
                    config.templateUrl = TEMPLATE_ALERT;
                }
                modal = $modal.open(config);
                modal.result['finally'](handleModalClose);

                /**
                 * Allows the title to be changed after modal creation.
                 * @param title String the desired title
                 */
                modal.setTitle = function(title){
                    config.scope.title = title;
                };

                // If we are auto-focusing, after the modal is opened set the
                // focusOnCloseBtn property to true.  This will cause the focus
                // snatcher directive to grab the focus. This allows the user to tab to other clickable elements in the
                // dialog (bug22884). In mobile safari this causes the modal slide down animation to stutter (bug23663).
                // Since bug22884 is more desktop related we won't allow the autoFocus option for ios to prevent the
                // animation stutter. Put this in a timeout to give the browser time to render the dialog.
                if (config.autoFocus && !browserSniffer.isIOS()) {
                    modal.opened.then(function() {
                        $timeout(function() {
                            config.scope.focusOnCloseBtn = true;
                        }, 300);
                    });
                }

                this.modals.push(modal);
                return modal;
            };

            /**
             * Used to dismiss all open spModal windows. Useful when we need to clear them
             * all away for a more important modal window (i.e. the login timeout notification).
             */
            service.closeAll = function() {
                if(this.modals) {
                    angular.forEach(this.modals, function(m){
                        // try/catch just in case the window is already gone.
                        try {
                            m.dismiss('force close');
                        }
                        catch(ignore){}
                    });
                    this.modals.length = 0;
                }
            };

            //Close all dialogs if the user hits the back button
            //Bind the $locationChangeSuccess event on the rootScope, so that we don't need to 
            //bind in individual controllers.  This value will update the value every time the URL is changed.
            $rootScope.$on('$locationChangeSuccess', function() {
                $rootScope.actualLocation = $location.path();
            });

            //this should fire every digest cycle and compare the new and old value for location.path only if it is
            //different should the function be fired
            $rootScope.$watch(function () {return $location.path();}, function (newLocation, oldLocation) {
                //watch location.path for changes and close modals only if the location was successfully changed
                if($rootScope.actualLocation === newLocation) {
                    service.closeAll();
                }
            });

            return service;
        }]);

angular.module('util/modal-dialog.html', []).run(['$templateCache', function($templateCache) {
    /**
     * A generic modal template that allows buttons, content, title and templates.
     */
    $templateCache.put('util/modal-dialog.html',
        '<div id="{{ dialogId }}" role="dialog" sp-ios-modal class="{{warningLevel}}-modal">\n' +
            '<div class="modal-header">\n' +
                '<button ng-click="$dismiss()" type="button" class="close" aria-hidden="true" tabindex="50">\n' +
                    '&#215;' +
                '</button>\n' +
                '<button ng-click="$dismiss()" id="closeModalDialogBtn" type="button" class="sr-only" ' +
                         'tabindex="50" sp-focus-snatcher="focusOnCloseBtn">\n' +
                    '{{\'ui_sr_close_dialog\' | spTranslate}}' +
                '</button>\n' +
                '<h4 class="modal-title" id="modalTitle" role="alert">' +
                    '<i ng-if="warningLevel === \'warning\'"class="fa fa-exclamation-triangle"></i>' +
                    '<i ng-if="warningLevel === \'danger\'"class="fa fa-minus-circle"></i>' +
                    '<i ng-if="isContextual && warningLevel === \'info\'"class="fa fa-info-circle"></i>' +
                    '<i ng-if="warningLevel === \'success\'"class="fa fa-check-circle"></i>' +
                    ' {{ title | spTranslate }}' +
                '</h4>\n' +
            '</div>\n' +
            '<div class="modal-body">\n' +
                '<div id="modal-content">\n' +
                  '<div ng-if="contentTemplateUrl" ng-include="contentTemplateUrl"></div>\n' +
                  '<div ng-if="!contentTemplateUrl" ng-bind-html="content"></div>\n' +
                '</div>\n' +
            '</div>\n' +
            // Buttons
            '<div class="modal-footer bg-light lt" ' +
                        'ng-if="(buttons != null && buttons.length > 0) || footerTemplateUrl != null">\n'+
                '<div ng-if="footerTemplateUrl" ng-include="footerTemplateUrl"></div>\n' +
                '<button ng-repeat="button in buttons" ' +
                        'ng-click="doButtonAction(button)" ' +
                        'type="button" class="btn {{button.extraClass}}" ' +
                        'ng-disabled="isButtonDisabled(button)"'+
                        'aria-disabled="{{isButtonDisabled(button)}}"'+
                        'ng-class="{\'btn-{{warningLevel}}\': button.primary || buttons.length === 1,' +
                            '\'btn-default\': button.primary, \'btn-secondary\': !button.primary}">' +
                        '{{button.displayValue | spTranslate}}' +
                '</button>\n' +
                '<p tabindex="50" id="inProgress" class="sr-only">' +
                    '{{inProgress ? (\'ui_modal_progress_message\' | spTranslate) : \'\' }}' +
                '</p>\n' +
            '</div>\n');
}]);

angular.module('util/modal-alert.html', []).run(['$templateCache', function($templateCache) {
    /**
     * Used to show a warning, info, error (danger) or success alert
     */
    $templateCache.put('util/modal-alert.html',
        '<div id="{{ dialogId }}" role="alertdialog" sp-ios-modal class="alert-modal">\n' +
            '<div class="modal-body modal-{{warningLevel}}">\n' +
                '<div class="row">' +
                    '<div class="col-xs-12">' +
                        '<button ng-click="$dismiss()" type="button" class="close" ' +
                            'aria-hidden="true" tabindex="50">\n' +
                            '&#215;' +
                        '</button>\n' +
                        '<button ng-click="$dismiss()" id="closeModalDialogBtn" type="button" class="sr-only" ' +
                            'tabindex="50" sp-focus-snatcher="focusOnCloseBtn">\n' +
                            '{{\'ui_sr_close_dialog\' | spTranslate}}' +
                        '</button>\n' +
                        '<p class="alert-heading" role="alert">' +
                            '<i class="fa fa-exclamation-triangle" ' +
                                'ng-if="warningLevel===\'warn\' || warningLevel===\'danger\'"></i> ' +
                            '<i class="fa fa-info-circle" ' +
                                'ng-if="!warningLevel || warningLevel===\'info\'"></i> ' +
                            '<i class="fa fa-check-circle" ' +
                                'ng-if="warningLevel===\'success\'"></i> ' +
                            '{{ title | spTranslate }}</p>' +
                        '<p role="alert">{{ content | spTranslate }}</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>\n');

}]);
