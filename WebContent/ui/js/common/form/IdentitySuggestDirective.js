'use strict';

angular.module('sailpoint.form').

/**
 * The spIdentitySuggest directive provides an identity suggest component that
 * allows typeahead completion and viewing a list of identities by clicking an
 * arrow button.  The following attributes are defined:
 *
 *  - sp-identity-suggest: Either the list of identities to display or an empty
 *    string if this directive should query for the identities.  If empty, the
 *    sp-identity-suggest-context attribute is required. [required]
 *
 *  - sp-identity-suggest-id: A unique ID for the identity suggest component.
 *    This also gets passed as the suggestId to the suggest REST service if
 *    sp-identity-suggest is blank. [required]
 *
 *  - sp-identity-suggest-context: The name of the identity selector config
 *    context to use to lookup identities.  This is required if the
 *    sp-identity-suggest attribute is blank. [optional]
 *
 *  - sp-identity-suggest-limit: The maximum number of identities to show in the
 *    suggest list.  This is only used if sp-identity-suggest-context is specified.
 *    Defaults to 5 if not specified. [optional]
 *    
 *  - sp-identity-suggest-editable: True if editable (accept text without matching Identity).
 *    Default is false.
 *
 *  - sp-identity-suggest-params: Object containing any additional parameters that 
 *    need to be sent for the identity selector config to return the correct identities.
 *    For example, when using WorkgroupMembers context, an object like:
 *    { workgroup: "workgroupId" } should be provided. This will be parsed with 
 *    angular.fromJson, so should be an Object or valid JSON string. [optional]
 *
 *  - ng-model: The model to bind to. [required]
 *
 *  - required: Set to true to make this field required. [optional]
 *
 *  - ng-required: An expression that should evaluate to true or false to
 *    indicate whether this field is required. [optional]
 *
 * Examples:
 *
 * <div sp-identity-suggest="identities | filter:$viewValue"
 *      sp-identity-suggest-id="myIdentity"
 *      ng-model="selectedIdentity" />
 *
 * Or
 *
 * <div sp-identity-suggest=""
 *      sp-identity-suggest-id="ownerNameSuggestBox"
 *      sp-identity-suggest-context="Owner"
 *      sp-identity-suggest-limit="10"
 *      ng-model="selectedIdentity" />
 */
directive('spIdentitySuggest', ['$templateCache', 'identitySuggestService',
                                function($templateCache, identitySuggestService) {
    return {
        restrict: 'A',

        template: function(element, attrs) {
            // The template contains a typeahead directive that databinds to the
            // specified ng-model.  For some reason, attempting to let this be
            // interpolated automatically by the template was causing errors.
            // Instead, we will pre-process the template and replace spModelName
            // with the ng-model specified in the attributes.
            var template = $templateCache.get('template/identity-suggest.html'),
                model = attrs.ngModel;

            if (!model) {
                throw 'ng-model is required for sp-identity-suggest.';
            }

            return template.replace(/{{spModelName}}/g, model);
        },

        link: {
            /**
             * Read configuration from the attributes into the scope and add
             * some methods to the scope that are needed by the directive.
             */
            pre: function(scope, element, attrs) {
                scope.identityList = attrs.spIdentitySuggest;
                scope.model = attrs.ngModel;

                // Allow using the required or ng-required attributes.
                scope.required =
                    attrs.required || (attrs.required === '') || attrs.ngRequired;

                // If a context is specified, we will handle the loading of the
                // identities from the server.
                scope.context = attrs.spIdentitySuggestContext;
                scope.suggestId = attrs.spIdentitySuggestId;
                if (scope.context) {
                    scope.identityList = 'searchIdentities($viewValue)';
                }

                if (!scope.identityList) {
                    throw 'sp-identity-suggest or sp-identity-suggest-context are required.';
                }

                // The suggestId is needed in the template to set the DOM ids.
                // Default it if not found in the attributes.
                scope.suggestId = scope.suggestId || 'identitySuggestField';

                // Allow the result limit to be overriden, but default to 5.
                scope.limit = attrs.spIdentitySuggestLimit || 5;

                scope.extraParams = (attrs.spIdentitySuggestParams) ?
                                        angular.fromJson(attrs.spIdentitySuggestParams) :
                                        null;
                
                scope.editable = attrs.spIdentitySuggestEditable || false;

                /**
                 * Search for the identities to be displayed in the typeahead
                 * dropdown using the given query string.
                 *
                 * @param {String} query  The query to use to search for the
                 *    identities.
                 *
                 * @return {Promise} A promise that resolves to an array with
                 *    the matching identities.
                 */
                scope.searchIdentities = function(query) {
                    return identitySuggestService.getIdentities(scope.context, scope.suggestId,
                                                                scope.limit, query, scope.extraParams);
                };

                /**
                 * Function used in comprehension expression to render label
                 * @param item The item to label
                 * @returns {String} displayableName or the the empty string if item is undefined.
                 */
                scope.identityLabelFunc = function(item) {
                    if(item) {
                        return item.displayableName;
                    }
                    return '';
                };

            }
        }
    };
}]).

run(['$templateCache', function($templateCache) {
    $templateCache.put('template/identity-suggest.html',
        /*
         * Notes:
         *  - The min-length is set to -1 so we can click the drop-down arrow to
         *    display the identity list without any input.
         *  - The wait-ms is required to make fetching the identity list happen
         *    in a separate digest cycle when the drop-down arrow is clicked.
         *    Otherwise this was not triggering the typeahead to be displayed.
         *  - The ng-model {{spModelName}} causes errors when bound in the
         *    template.  Instead of letting $interpolate handle this, we pre-process
         *    this template to replace this.
         */
        '<div class="identity-suggest-container">' +
            '<sp-typeahead-input ' +
            '       ng-model="{{spModelName}}" ' +
            '       sp-typeahead-input-id="{{suggestId}}" ' +
            '       sp-typeahead-input-items="item as identityLabelFunc(item) ' +
            '                                 for item in {{identityList}}" ' +
            '       sp-typeahead-input-template-url="template/identity-suggest-item.html">' +
            '</sp-typeahead-input>' +
        '    <div class="identity-suggest-icon">' +
        '      <i class="fa"' +
        '         ng-class="{ \'fa-user\': {{ model }} && !{{ model }}.isWorkgroup, ' +
        '                     \'fa-users\': {{ model }} && {{ model }}.isWorkgroup }"></i>' +
        '    </div>' +
        '</div>');

    $templateCache.put('template/identity-suggest-item.html',
        '<a class="suggest-item" role="option" aria-live="assertive">' +
        '  <div>' +
        '    <i class="fa {{ (match.model.isWorkgroup) ? \'fa-users\' : \'fa-user\' }}"></i>' +
        '    <span bind-html-unsafe="match.model.displayableName | typeaheadHighlight:query" />' +
        '    <span class="indented">{{ match.model.email }}</span>' +
        '  </div>' +
        '</a>');
}]);