/**
 * Directive to display entitlements from a role in a table format with an icon
 * that, when clicked, displays the full description
 */
angular.module('sailpoint.widget').
    directive('spRoleEntitlements', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                entitlements: '=', // the list of entitlements
                totalCount: '=' // the total count of all (simple and complex) entitlements
            },
            templateUrl: 'access-request/role-entitlements-directive.html'
        };
    }).
    run(['$templateCache', function($templateCache) {
        $templateCache.put('access-request/role-entitlements-directive.html',
        '<div role="presentation">' +
        '  <div ng-if="entitlements && entitlements.length > 0" role="presentation" ' +
        '    class="table-responsive table-responsive-wide-title table-no-border">' +
        '    <table class="table table-striped m-b-none text-md role-entitlement-detail-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th>{{ \'ui_item_detail_application\' | spTranslate }}</th>' +
        '          <th>{{ \'ui_item_detail_attribute\' | spTranslate }}</th>' +
        '          <th>{{ \'ui_item_detail_name\' | spTranslate }}</th>' +
        '          <th>{{ \'ui_item_detail_assigned\' | spTranslate }}</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' +
        '        <tr ng-repeat="entitlement in entitlements">' +
        '          <td data-title="{{ \'ui_item_detail_application\' | spTranslate }}" class="v-middle">' +
        '             <p>{{ entitlement.applicationName}}</p></td>' +
        '          <td data-title="{{ \'ui_item_detail_attribute\' | spTranslate }}" class="v-middle">' +
        '             <p>{{ entitlement.property }}</p></td>' +
        '          <td data-title="{{ \'ui_item_detail_name\' | spTranslate }}" class="description-text v-middle">' +
        '              <p><span class="text-description">{{ entitlement.displayValue }}' +
        '                   <a data-toggle="collapse" data-target="#mobile-description-{{$index}}"' +
        '                     ng-if="entitlement.description" id="name-info-link-{{$index}}"' +
        '                     class="visible-xs-inline-block pull-right">' +
        '                     <i class="fa fa-chevron-down text-info chevron-padding" sp-expander=""></i>' +
        '                  </a></span>' +
        '              <button class="btn btn-sm btn-link hidden-xs" id="name-info-button-{{$index}}" ' +
        '                title="" ng-if="entitlement.description" ng-cloak=""' +
        '                popover-placement="bottom" popover-animation="false"' +
        '                popover="{{entitlement.description}}" sp-popover-hover="true"' +
        '                popover-title="{{ \'ui_entitlement_description\' | spTranslate }}">' +
        '                  <span class="sr-only">{{ entitlement.displayValue }} ' +
        '                    {{ \'ui_entitlement_description_button\' | spTranslate }}</span>' +
        '                <i class="fa fa-info-circle text-info" aria-hidden="true"></i>' +
        '              </button>' +
        '              </p>' +
        '            <div id="mobile-description-{{$index}}" class="collapse">' +
        '              <div class="description-text" ng-bind-html="entitlement.description"></div>' +
        '            </div>' +
        '          </td>' +
        '          <td data-title="{{ \'ui_item_detail_assigned\' | spTranslate }}" class="v-middle">' +
        '             <p>{{ entitlement.roleName }}</p></td>' +
        '        </tr>' +
        '      </tbody>' +
        '    </table>' +
        '  </div>' +
        '  <div class="panel-body" role="presentation"' +
        '      ng-if="totalCount === 0">' +
        '    {{ \'ui_item_detail_no_entitlements\' | spTranslate }}' +
        '  </div>' +
        '  <div class="panel-body" role="presentation"' +
        '      ng-if="totalCount < 0">' +
        '    {{ \'ui_item_detail_only_complex_entitlements\' | spTranslate }}' +
        '  </div>' +
        '</div>');
    }]);
