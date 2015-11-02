/*
 * Override to add code to play nice with screen readers
 */

/**
 * Override template to add accessibility prompts. Also removed the boundary links html because we do
 * not use them. If we decide to use them that html should be added back.
 */
angular.module('template/pagination/pagination.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/pagination/pagination.html',
        '<ul class="pagination pagination-sm">\n' +
        '  <li ng-if="directionLinks" ng-class="{disabled: noPrevious()}">' +
        '    <a href="" aria-disabled="{{noPrevious()}}" ng-click="selectPage(page - 1)">' +
        '      <span aria-hidden="true"><i class="fa fa-chevron-left"></i></span>' +
        '      <span class="sr-only">#{msgs.ui_pager_prev}</span>' +
        '    </a>' +
        '  </li>\n' +
        '  <li class="visible-xs-inline">' +
        '      <span aria-hidden="true">#{msgs.ui_pager_page} {{page}} #{msgs.ui_pager_of} {{totalPages}}</span>' +
        '      <span class="sr-only">#{msgs.ui_pager_page} {{page.text}}</span>'+
        '  </li>\n' +
        '  <li class="hidden-xs" ng-repeat="page in pages track by $index" ng-class="{active: page.active}">' +
        '    <a href="" ng-click="selectPage(page.number)">' +
        '      <span aria-hidden="true">{{page.text}}</span>' +
        '      <span class="sr-only">#{msgs.ui_pager_page} {{page.text}}</span>'+
        '      <span class="sr-only" ng-if="page.active">#{msgs.ui_pager_active_text}</span>'+
        '    </a>' +
        '  </li>\n' +
        '  <li ng-if="directionLinks" ng-class="{disabled: noNext()}">' +
        '    <a href="" aria-disabled="{{noNext()}}" ng-click="selectPage(page + 1)">' +
        '      <span aria-hidden="true"><i class="fa fa-chevron-right"></i></span>' +
        '      <span class="sr-only">#{msgs.ui_pager_next}</span>' +
        '    </a>' +
        '  </li>\n' +
        '</ul>');
}]);

/**
 * Override tab panel templates to add tab indexes
 */
angular.module('template/tabs/tab.html', []).run(['$templateCache',
    function($templateCache) {
        $templateCache.put('template/tabs/tab.html',
        '<li ng-class="{active: active, disabled: disabled}">\n' +
        '  <a ng-click="select()" href="" tabindex="50" tab-heading-transclude>\n'+
        '    {{heading}}\n' +
        '    <span class="sr-only" aria-hidden="{{!active}}">#{msgs.ui_tab_active_link}</span>\n' +
        '    <span class="sr-only" aria-hidden="{{!disabled}}">#{msgs.ui_tab_disabled_link}</span>\n' +
        '  </a>\n' +
        '</li>\n' +
        '');
    }
]);

/**
 * Override to add tab explanation
 */
angular.module('template/tabs/tabset.html', []).run(['$templateCache',
    function($templateCache) {
        $templateCache.put('template/tabs/tabset.html',
        '\n' +
        '<div class="tabbable">\n' +
        '  <span class="sr-only">#{msgs.ui_tab_explanation}</span>\n' +
        '  <header class="panel-heading bg-light">' +
        '    <ul class="nav {{type && \'nav-\' + type}}" ' +
        '      ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude>' +
        '    </ul>\n' +
        '  </header>' +
        '  <div class="tab-content">\n' +
        '    <div class="tab-pane" \n' +
        '         ng-repeat="tab in tabs" \n' +
        '         ng-class="{active: tab.active}"\n' +
        '         tab-content-transclude="tab">\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '');
    }
]);

/*
 * Override the day, month, and year templates
 *   - Switches btn-default to btn-white
  *  - Switch glyphicon fonts to font awesome font
 */
angular.module('template/datepicker/day.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/datepicker/day.html',
        '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' +
            '  <thead>\n' +
            '    <tr>\n' +
            '      <th>' +
            '        <button type="button" class="btn btn-white btn-sm pull-left" ng-click="move(-1)" tabindex="-1">' +
            '          <i class="fa fa-arrow-left"></i>' +
            '        </button>' +
            '      </th>\n' +
            '      <th colspan="{{5 + showWeeks}}">' +
            '        <button id="{{uniqueId}}-title" ' +
            '                role="heading" ' +
            '                aria-live="assertive" ' +
            '                aria-atomic="true" ' +
            '                type="button" ' +
            '                class="btn btn-white btn-sm" ' +
            '                ng-click="toggleMode()" ' +
            '                tabindex="-1" ' +
            '                style="width:100%;">' +
            '          <strong>{{title}}</strong>' +
            '        </button>' +
            '      </th>\n' +
            '      <th>' +
            '        <button type="button" class="btn btn-white btn-sm pull-right" ng-click="move(1)" tabindex="-1">' +
            '          <i class="fa fa-arrow-right"></i>' +
            '        </button>' +
            '     </th>\n' +
            '    </tr>\n' +
            '    <tr>\n' +
            '      <th ng-show="showWeeks" class="text-center"></th>\n' +
            '      <th ng-repeat="label in labels track by $index" class="text-center">' +
            '        <small aria-label="{{label.full}}">{{label.abbr}}</small>' +
            '      </th>\n' +
            '    </tr>\n' +
            '  </thead>\n' +
            '  <tbody>\n' +
            '    <tr ng-repeat="row in rows track by $index">\n' +
            '      <td ng-show="showWeeks" class="text-center h6"><em>{{ weekNumbers[$index] }}</em></td>\n' +
            '      <td ng-repeat="dt in row track by dt.date" ' +
            '          class="text-center" ' +
            '          role="gridcell" ' +
            '          id="{{dt.uid}}" ' +
            '          aria-disabled="{{!!dt.disabled}}">\n' +
            '        <button type="button" ' +
            '                style="width:100%;" ' +
            '                class="btn btn-white btn-sm" ' +
            '                ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ' +
            '                ng-click="select(dt.date)" ' +
            '                ng-disabled="dt.disabled" tabindex="-1">' +
            '          <span ng-class="{\'text-muted\': dt.secondary, \'text-info\': dt.current}">{{dt.label}}</span>' +
            '        </button>\n' +
            '      </td>\n' +
            '    </tr>\n' +
            '  </tbody>\n' +
            '</table>\n' +
            '');
}]);

angular.module('template/datepicker/month.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/datepicker/month.html',
        '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' +
            '  <thead>\n' +
            '    <tr>\n' +
            '      <th>' +
            '        <button type="button" class="btn btn-white btn-sm pull-left" ng-click="move(-1)" tabindex="-1">' +
            '          <i class="fa fa-arrow-left"></i>' +
            '        </button>' +
            '      </th>\n' +
            '      <th>' +
            '        <button id="{{uniqueId}}-title" ' +
            '                role="heading" ' +
            '                aria-live="assertive" ' +
            '                aria-atomic="true" ' +
            '                type="button" ' +
            '                class="btn btn-white btn-sm" ' +
            '                ng-click="toggleMode()" ' +
            '                tabindex="-1" ' +
            '                style="width:100%;"><strong>{{title}}</strong>' +
            '        </button></th>\n' +
            '      <th>' +
            '        <button type="button" class="btn btn-white btn-sm pull-right" ng-click="move(1)" tabindex="-1">' +
            '          <i class="fa fa-arrow-right"></i>' +
            '        </button>' +
            '      </th>\n' +
            '    </tr>\n' +
            '  </thead>\n' +
            '  <tbody>\n' +
            '    <tr ng-repeat="row in rows track by $index">\n' +
            '      <td ng-repeat="dt in row track by dt.date" ' +
            '          class="text-center" ' +
            '          role="gridcell" ' +
            '          id="{{dt.uid}}" ' +
            '          aria-disabled="{{!!dt.disabled}}">\n' +
            '        <button type="button" ' +
            '                style="width:100%;" ' +
            '                class="btn btn-white" ' +
            '                ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ' +
            '                ng-click="select(dt.date)" ' +
            '                ng-disabled="dt.disabled" ' +
            '                tabindex="-1"><span ng-class="{\'text-info\': dt.current}">{{dt.label}}</span>' +
            '         </button>\n' +
            '      </td>\n' +
            '    </tr>\n' +
            '  </tbody>\n' +
            '</table>\n' +
            '');
}]);

angular.module('template/datepicker/year.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/datepicker/year.html',
        '<table role="grid" aria-labelledby="{{uniqueId}}-title" aria-activedescendant="{{activeDateId}}">\n' +
            '  <thead>\n' +
            '    <tr>\n' +
            '      <th>' +
            '        <button type="button" ' +
            '                class="btn btn-white btn-sm pull-left" ' +
            '                ng-click="move(-1)" ' +
            '                tabindex="-1"><i class="fa fa-arrow-left"></i>' +
            '        </button>' +
            '      </th>\n' +
            '      <th colspan="3">' +
            '        <button id="{{uniqueId}}-title" ' +
            '                role="heading" ' +
            '                aria-live="assertive" ' +
            '                aria-atomic="true" ' +
            '                type="button" ' +
            '                class="btn btn-white btn-sm" ' +
            '                ng-click="toggleMode()" ' +
            '                tabindex="-1" ' +
            '                style="width:100%;"><strong>{{title}}</strong>' +
            '          </button>' +
            '        </th>\n' +
            '      <th>' +
            '        <button type="button" ' +
            '                class="btn btn-white btn-sm pull-right" ' +
            '                ng-click="move(1)" ' +
            '                tabindex="-1"><i class="fa fa-arrow-right"></i>' +
            '        </button>' +
            '      </th>\n' +
            '    </tr>\n' +
            '  </thead>\n' +
            '  <tbody>\n' +
            '    <tr ng-repeat="row in rows track by $index">\n' +
            '      <td ng-repeat="dt in row track by dt.date" ' +
            '          class="text-center" ' +
            '          role="gridcell" ' +
            '          id="{{dt.uid}}" ' +
            '          aria-disabled="{{!!dt.disabled}}">\n' +
            '        <button type="button" ' +
            '                style="width:100%;" ' +
            '                class="btn btn-white" ' +
            '                ng-class="{\'btn-info\': dt.selected, active: isActive(dt)}" ' +
            '                ng-click="select(dt.date)" ' +
            '                ng-disabled="dt.disabled" tabindex="-1">' +
            '          <span ng-class="{\'text-info\': dt.current}">{{dt.label}}</span>' +
            '        </button>\n' +
            '      </td>\n' +
            '    </tr>\n' +
            '  </tbody>\n' +
            '</table>\n' +
            '');
}]);

/*
 * Overriding the datepicker popup template
 *   - change popup alignment from left to right
 */
angular.module('template/datepicker/popup.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/datepicker/popup.html',
    '<ul class="dropdown-menu sp-datepicker-popup" ' +
    '    ng-style="{display: (isOpen && \'block\') || \'none\', top: position.top+\'px\'}" ' +
    '    ng-keydown=\"keydown($event)\">\n' +
    '  <li ng-transclude></li>\n' +
    '  <li ng-show="showButtonBar" style="padding:10px 9px 2px">\n' +
    '    <span class="btn-group">\n' +
    '      <button type=\"button\" class=\"btn btn-sm btn-info\" ng-click=\"select(\'today\')\">' +
    '        {{ getText(\'current\') }}' +
    '      </button>\n' +
    '      <button type=\"button\" class=\"btn btn-sm btn-danger\" ng-click=\"select(null)\">' +
    '        {{ getText(\'clear\') }}' +
    '      </button>\n' +
    '    </span>\n' +
    '    <button type="button" class="btn btn-sm btn-success pull-right" ng-click="close()">' +
    '      {closeText}}' +
    '    </button>\n' +
    '  </li>\n' +
    '</ul>\n' +
    '');
}]);

/**
 * Overriding to add "aria-labelledby" to the modal 
*/
angular.module('template/modal/window.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/modal/window.html',
    '<div tabindex="-1" role="dialog" aria-labelledby="modalTitle" class="modal fade" ng-class="{in: animate}" ' +
    '    ng-style="{\'z-index\': 1050 + index*10, display: \'block\'}" ng-click="close($event)">\n' +
    '  <div class="modal-dialog" ng-class="{\'modal-sm\': size == \'sm\', \'modal-lg\': size == \'lg\'}">\n' +
    '    <div class="modal-content" ng-transclude></div>\n' +
    '  </div>\n' +
    '</div>');
}]);

/**
 * Give a tab index to the line items.  Typeahead in IE 11 does not work without that. Also add 'no results found'
 * message to indicate that nothing was returned for the typeahead
 */
angular.module('template/typeahead/typeahead-popup.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/typeahead/typeahead-popup.html',
        '<ul class="dropdown-menu" ng-if="isOpen()" ' +
            'ng-style="{top: position.top+\'px\', left: position.left+\'px\'}" ' +
            'style="display: block;" role="listbox" aria-hidden="{{!isOpen()}}">\n' +
            '    <li ng-repeat="match in matches track by $index" ng-class="{active: isActive($index) }" ' +
            '        ng-mouseenter="selectActive($index)" ng-click="selectMatch($index)" role="option" ' +
            '        id="{{match.id}}" tabindex="50" ng-if="!isEmpty()">\n' +
            '        <div typeahead-match index="$index" match="match" query="query" ' +
            '             template-url="templateUrl"></div>\n' +
            '    </li>\n' +
            '    <li ng-if="isEmpty()"><span class="no-results">#{msgs.no_results_found}</span></li>' +
            '</ul>');
}]);
