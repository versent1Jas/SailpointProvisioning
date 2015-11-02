angular.module('sailpoint.directive')

    // Click to navigate similar to <a href="#/partial"> but hash is not required,
    // e.g. <div click-link="/partial">
    .directive('spClickLink', ['$location', function($location) {
        return {
            link: function(scope, element, attrs) {
                element.on('click', function() {
                    scope.$apply(function() {
                        var link = attrs.spClickLink;
                        if (link) {
                            // $location.path requires the URL to begin with a forward slash
                            // and will append one if it doesn't exist.  If we have a hash, we need
                            // to strip it off so we don't wind up with /#/somePath.
                            if (link.indexOf('#') === 0) {
                                link = link.substring(1);
                            }
                            $location.path(link);
                        }
                    });
                });
            }
        };
    }]);
