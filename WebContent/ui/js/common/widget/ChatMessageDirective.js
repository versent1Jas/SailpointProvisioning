/**
 * Directive to replace sp-chat-message tag with full styled html chat style message. 
 * 
 * text - the message text to show
 * srtext - the message put in a tag for screen readers to read.  shownText is used if srText is not present
 * sender - the string describing where the message is coming from
 * timestamp - the timestamp when the meessage was created
 * right - the string true if it the chat message should be right aligned otherwise it will be left aligned
 */
angular.module('sailpoint.widget')
.directive('spChatMessage', function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'widget/message-template.html',
        scope: {
            text: '@',
            srtext: '@',
            sender: '@',
            timestamp: '@',
            right: '@',
            emptytext: '@'
        },
        link: function(scope) {
            //if srtext is not given use showntext as srtext
            if (!scope.srtext){
                scope.readerText = scope.text;
            }else{
                scope.readerText = scope.srtext;
            }
            
            if (scope.right === 'true'){
                scope.pull = 'pull-right';
                scope.chatBody = 'right';
            } else {
                scope.pull = 'pull-left';
                scope.chatBody= 'left';
            }
        }
    };
});

angular.module('widget/message-template.html', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('widget/message-template.html',
          '<article class="chat-item {{chatBody}}">\n' +
          '  <span role="presentation" class="{{pull}} thumb-sm avatar">\n' +
          '    <img role="presentation" src="' + SailPoint.CONTEXT_PATH +
          '/ui/images/avatar_default.jpg" class="img-circle"/>\n' +
          '  </span>\n' +
          '  <section class="chat-body">\n' +
          '    <div class="panel bg-light lter text-sm m-b-none">\n' +
          '      <div class="panel-body" aria-hidden="true">\n' +
          '        <span class="line-breaks" ng-show="!!text" ng-bind-html="text"></span>\n' +
          '        <span class="chat-empty-text" ng-show="!text">{{emptytext}}</span>\n' +
          '      </div>\n' +
          '      <div class="sr-only">{{readerText}}</div>\n' +
          '    </div>\n' +
          '    <small class="text-muted">\n' +
          '      <i class="fa fa-user text-info" aria-hidden="true"></i>\n' +
          '      {{ sender }}' +
          '    </small>\n' +
          '    <small class="m-l-xs text-muted">\n' +
          '      <i role="presentation" class="fa fa-clock-o text-info" aria-hidden="true"></i>\n' +
          '      {{ timestamp }}' +
          '    </small>\n' +
          '  </section>\n' +
          '</article>');
}]);
