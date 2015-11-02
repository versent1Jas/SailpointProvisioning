/*
 * Copyright (C) 2015 SailPoint Technologies, Inc.  All rights reserved.
 */
'use strict';

angular.module('sailpoint.accessrequest').
    factory('accessRequestDeepFilterService',
        ['AccessRequestIdentity', 'AccessRequestItem', 'SP_CURR_USER_ID', 'SP_CURR_DISPLAYABLE_USER_NAME',
            'SP_CURR_USER_NAME', 'SP_CONTEXT_PATH', '$q', '$location', 'accessRequestIdentityService',
            'accessRequestItemsService', 'accessRequestFilterService', 'SearchData',

            /* jshint maxparams: 12 */
            function (AccessRequestIdentity, AccessRequestItem, SP_CURR_USER_ID, SP_CURR_DISPLAYABLE_USER_NAME,
                      SP_CURR_USER_NAME, SP_CONTEXT_PATH, $q, $location, accessRequestIdentityService,
                      accessRequestItemsService, accessRequestFilterService, SearchData) {

                var FILTER_KEYWORD = 'filterKeyword';
                var FILTER_ENTITLEMENT_PREFIX = 'filterEntitlement';
                var FILTER_ROLE_PREFIX = 'filterRole';

                /**
                 * The following are used with the $location.path() to determine if we are on the correct
                 * tab when we determine if the deep links are active.
                 * @type {string}
                 */
                var PATH_MANAGE_ACCESS = 'manageAccess/add';
                var PATH_MANAGE_ACCESS_SELF = 'accessRequestSelf/add';
                var PATH_REVIEW = 'accessRequest/review';
                var PATH_REVIEW_SELF = 'accessRequestSelf/review';

                /**
                 * The list of available filters for the review items page that we need to send up as
                 * the property on the filter to the backend
                 *
                 * @type {Object}
                 */
                var allowedReviewItemParams = [
                    'role',
                    'entitlement',
                    'entitlementApplication',
                    'entitlementAttribute',
                    'entitlementValue'
                ];

                /**
                 * Returns an AccessRequestIdentity representation of the currently-logged in user
                 * @return {AccessRequestIdentity} the currently logged in user
                 */
                function getCurrentUser() {
                    return new AccessRequestIdentity({
                        id: SP_CURR_USER_ID,
                        name: SP_CURR_USER_NAME,
                        displayName: SP_CURR_DISPLAYABLE_USER_NAME
                    });
                }

                var accessRequestDeepFilterService = {

                    /**
                     * The request parameters in the url pulled from $location.search()
                     */
                    requestParameters: $location.search(),

                    /**
                     * A list of filters to apply to the request for access items on the review page
                     */
                    filtersReview : {},

                    /**
                     * A list of filters to apply to the request for access items on the manage access page
                     */
                    filtersManageAccess : {},

                    /**
                     * The user targeted for this deep link (the user who is the recipient of the requested items).
                     *
                     * @type {AccessRequestIdentity}
                     */
                    targetIdentity: undefined,

                    /**
                     * The list of review items to be added to the cart based on what the request parameters create
                     * for a filter
                     */
                    reviewItems : undefined,

                    /**
                     * Whether the request parameters indicate that this is a deep link or not on the review page
                     */
                    deepLinkReview: false,

                    /**
                     * Whether the request parameters indicate that this is a deep link or not on the manage access
                     * page
                     */
                    deepLinkManageAccess: false,

                    /**
                     * Go through the list of allowed review item filter params that we support and look to see
                     * if any of them are on the request parameters from $location.search.
                     *
                     * If we find any, add them as a filter to the filters object and set isDeepLink = true
                     */
                    /* jshint loopfunc:true */
                    initReviewParams : function() {
                        var me = this;
                        for(var param in me.requestParameters) {
                            if(me.requestParameters.hasOwnProperty(param)) {
                                angular.forEach(allowedReviewItemParams, function(allowedParam) {
                                    var filterValue = null;
                                    if(allowedParam===param || param.indexOf(allowedParam)===0) {
                                        filterValue = me.requestParameters[param];
                                    }

                                    if(filterValue) {
                                        /* Decode the uri and replace any +'s since the rest call will add them back */
                                        var decodedValue = decodeURIComponent(filterValue).replace(/[+]/g,' ');
                                        me.filtersReview[param] = decodedValue;

                                        me.deepLinkReview = true;
                                    }
                                });
                            }
                        }
                    },

                    /**
                     * Set deep link == true if any of the request params starts with "filterEntitlement" or
                     * "filterRole" or contains the "filterKeyword" parameter
                     */
                    initRequestAccessParams: function() {
                        var me = this;
                        if(me.requestParameters[FILTER_KEYWORD]) {
                            me.filtersManageAccess[FILTER_KEYWORD] = me.requestParameters[FILTER_KEYWORD];
                            me.deepLinkManageAccess = true;
                            return;
                        }

                        for(var param in me.requestParameters) {
                            if(me.requestParameters.hasOwnProperty(param)) {
                                if(param.indexOf(FILTER_ROLE_PREFIX)===0 ||
                                    param.indexOf(FILTER_ENTITLEMENT_PREFIX)===0) {
                                    me.deepLinkManageAccess = true;
                                    return;
                                }
                            }
                        }

                    },

                    /**
                     * Initialize the filters and set the deep link to true if we find any that match
                     */
                    init : function() {

                        this.initReviewParams();
                        this.initRequestAccessParams();

                        /* If there are no filter params, they can still just set the identityName and
                        we consider it a deep link */
                        if(accessRequestDeepFilterService.requestParameters.identityName) {
                            this.deepLinkManageAccess = true;
                            this.deepLinkReview = true;
                        }
                    },

                    /**
                     * Return true if query parameters make this a Review tab deep link. Otherwise, false.
                     * Uses the actual location path to ensure that this is only on the review tab
                     * @returns {boolean} Whether the current url contains a deep link on the review page
                     */
                    isDeepLinkReview : function() {
                        var path = $location.path();
                        return this.deepLinkReview &&
                            (path.indexOf(PATH_REVIEW) >= 0 || path.indexOf(PATH_REVIEW_SELF) >= 0);
                    },

                    /**
                     * Return true if query parameters make this a Manage Access tab deep link. Otherwise, false.
                     * Uses the actual location path to ensure that this is only on the manage access tab
                     * @returns {boolean} Whether the current url contains a deep link on the manage
                     * access page
                     */
                    isDeepLinkManageAccess : function() {
                        var path = $location.path();
                        return this.deepLinkManageAccess &&
                            (path.indexOf(PATH_MANAGE_ACCESS) >= 0 || path.indexOf(PATH_MANAGE_ACCESS_SELF) >= 0);
                    },

                    /**
                     * A convenience function for returning whether this is a deep link (either manage access or review)
                     * @returns {boolean} Whether this is a deep link
                     */
                    isDeepLink : function() {
                        return this.deepLinkManageAccess || this.deepLinkReview;
                    },

                    /**
                     * Returns the target identity for this deep link.  We first try to pull it from the
                     * identityName property on the url.  If not found, we return the current user
                     *
                     * @return {Promise<AccessRequestIdentity>} the identity that is the requestee of this deep link
                     */
                    getTargetIdentity: function () {
                        var me = this, deferred = $q.defer();

                        if (!me.targetIdentity) {

                            /* If the identityName parameter is set, try to look the user up via the requestable
                             * identities REST endpoint and return that as the targetIdentity.  If no
                             * identity is found, we return undefined and let the controllers add error messages
                             */
                            if(me.requestParameters.identityName) {
                                return accessRequestIdentityService.getIdentities(me.requestParameters.identityName)
                                    .then(function(response) {
                                        if(response && response.data && response.data.count > 0) {
                                            me.targetIdentity = new AccessRequestIdentity(response.data.objects[0]);
                                        } else {
                                            /* Delete the param so we don't try to look it up again */
                                            delete me.requestParameters.identityName;
                                        }
                                        // Return undefined if we can't find an identity
                                        return me.targetIdentity;
                                    });
                            }

                            /* If the identityName param is empty or undefined, just return the current user */
                            else {
                                me.targetIdentity = getCurrentUser();
                            }
                        }

                        deferred.resolve(me.targetIdentity);
                        return deferred.promise;
                    },

                    /**
                     * Returns a searchData object that represents the set of ui filters that we've pulled off
                     * the url query parameters.  It does this by sending the full set of request parameters
                     * from location.search up to the backend.  The backend then converts the values into
                     * full objects that we can then set on the suggests
                     *
                     * @return {Promise<SearchData>} A Search Data object with keyword and filters set
                     */
                    getItemSearchData : function() {
                        var me = this, deferred = $q.defer();
                        if (!me.searchData) {
                            var requesteeId = this.targetIdentity ? this.targetIdentity.getId() : '';
                            return accessRequestFilterService.getAccessFilterValues($location.search(), requesteeId)
                                .then(function(response) {
                                    var searchData = new SearchData();
                                    /* Set the keyword search */
                                    searchData.searchTerm = me.filtersManageAccess[FILTER_KEYWORD];
                                    searchData.filterValues = response.data;

                                    return searchData;
                                });
                        }

                        deferred.resolve(me.searchData);
                        return deferred.promise;

                    },

                    /**
                     * Fetch the available access items that this user can add to their cart based on
                     * the filters that we created from the request parameters during intialization
                     *
                     * @return {Promise<Array<AccessRequestItem>>} A promise that returns a list of AccessRequestItems
                     */
                    getReviewItems: function() {
                        var me = this, deferred = $q.defer();
                        if (!me.reviewItems) {

                            // If there are no filters, don't bother fetching any items since this is likely an
                            // error condition.
                            if (!Object.keys(me.filtersReview).length) {
                                throw 'Filters required for review items.';
                            }

                            return accessRequestItemsService
                                .getAccessRequestItems(null, me.filtersReview, 0, 99, me.targetIdentity.getId())
                                .then(function(response) {
                                    me.reviewItems = [];
                                    angular.forEach(response.data.objects, function(object) {
                                        me.reviewItems.push(new AccessRequestItem(object));
                                    });
                                    return me.reviewItems;
                                });
                        }

                        deferred.resolve(me.reviewItems);
                        return deferred.promise;
                    },

                    /**
                     * Resets all the deep link data after the initial page load.
                     */
                    reset: function() {
                        var me = this;
                        me.filtersReview = {};
                        me.filtersManageAccess = {};
                        me.targetIdentity = undefined;
                        me.reviewItems = undefined;
                        me.deepLinkReview = false;
                        me.deepLinkManageAccess = false;
                    }
                };

                ////////////////////////////////////////////////////////////////////////////
                //
                // INITIALIZATION
                //
                ////////////////////////////////////////////////////////////////////////////
                accessRequestDeepFilterService.init();

                return accessRequestDeepFilterService;

            }]);
