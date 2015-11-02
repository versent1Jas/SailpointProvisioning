angular.module('sailpoint.modal').
    directive('spIosModal', function(browserSniffer, $timeout) {
        return function() {
            if (browserSniffer.isIOS()) {
                $timeout(function() {
                    /*
                     * HACK ALERT! 
                     * WE HAVE TO DO THIS FOR AN IOS BUG WITH BOOTSTRAP MODALS
                     * THIS HACK TAKEN FROM https://github.com/twbs/bootstrap/pull/9339
                     * 
                     * iOS will not move the fixed backdrop and modal container when the
                     * keyboard is shown, so switch them to absolute and manually make them
                     * fill the page as it is shaped now. This will break if the page
                     * changes shape. We also need to add padding to the modal container so
                     * the contents appears where we are looking, otherwise it would be at
                     * the top of the page. We do the modal container first as it may
                     * change the shape of the page.
                     */
                    var modalElement = angular.element('.modal');
                    if (modalElement) {
                        modalElement.css('padding-top', window.pageYOffset);
                        modalElement.addClass('modal-ios');

                        modalElement.height(Math.max(
                            angular.element(document).height(),
                            angular.element(window).height()));
                    }

                    $timeout(function() {
                        var modalBackdrop = angular.element('.modal-backdrop');
                        if (modalBackdrop) {
                            modalBackdrop.addClass('modal-backdrop-ios');

                            modalBackdrop.height(Math.max(
                                angular.element(document).height(),
                                angular.element(window).height()));
                        }
                    }, 1000);
                }, 0);
            }
        };
    });