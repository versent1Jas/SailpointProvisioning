'use strict';

/**
 * A service that can display a modal dialog with a title and some content.
 */
angular.module('sailpoint.modal').
    factory('infoModalService',
            ['$rootScope', 'spModal',
             function($rootScope, spModal) {

        var service = {};

        /**
         * Open a modal dialog with the given title, content, and ID.
         *
         * @param {String} title    The title for the dialog.
         * @param {String} content  The content (possibly with HTML) to include.
         * @param {String} [id]     The optional ID to assign to the modal element.
         *
         * @return {$modalInstance} The modal instance returned from $modal.open().
         */
        service.open = function(title, content, id) {
            if (null === title) {
                throw 'Title is required';
            }
            if (null === content) {
                throw 'Content is required';
            }

            // Make sure we have an id.
            id = id || 'infoModal';

            return spModal.open({
                title: title,
                content: content,
                id: id
            });
        };

        return service;
    }]);
