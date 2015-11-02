'use strict';
/**
 * Controller for the Violation Details Dialog.
 */
angular.module('sailpoint.approval').
    controller('ViolationDetailDialogCtrl',
        ['$scope', 'approvalService',
            function($scope, approvalService) {

                /**
                 * @description
                 * Builds the approval details key value pair for the approval and adds
                 * it to the current scope
                 */
                function fetchViolationDetails() {
                    var violation = $scope.violation;
                    approvalService.getViolationDetails($scope.approval.id, violation.policyName, violation.ruleName).
                        then(function(result){
                            $scope.violationDetails = result.data;
                        }).catch(function(result) {
                            $scope.$dismiss(result);
                        });
                }

                fetchViolationDetails();

                /**
                 * The violation summary field should not be displayed if the violation summary is undefined
                 * or if it is the same as the rule description
                 * @returns {boolean} True if  the violation should be displayed false otherwise
                 */
                $scope.isViolationSummaryDisplayable = function() {
                    var violationDetails = $scope.violationDetails;
                    return violationDetails && violationDetails.violationSummary &&
                        (violationDetails.violationSummary !== violationDetails.ruleDescription);
                };
            }]);
