'use strict';

/**
 * AssignedRole is a model object that represents an existing role assignment.
 */
angular.module('sailpoint.accessrequest').

factory('AssignedRole', function() {
    /**
     * Constructor.
     *
     * @param {Object} data  An object with the data for this assigned role.
     *
     * @throws If data is not an object.
     */
    function AssignedRole(data) {
        // Throw if the data is null or not a javascript object.
        if (!angular.isObject(data)) {
            throw 'Data required in constructor.';
        }

        // Instance variables.

        this.assignmentId = data.assignmentId;
        this.roleId = data.roleId;
        this.name = data.name;
        this.assigner = data.assigner;
        this.assignmentNote = data.assignmentNote;
        if (data.created) {
            this.created = new Date(data.created);
        }
    }

    /**
     * Get the assignment ID
     * @returns {String} The assignment ID
     */
    AssignedRole.prototype.getAssignmentId = function() {
        return this.assignmentId;
    };

    /**
     * Get the role ID
     * @returns {String} The role ID
     */
    AssignedRole.prototype.getRoleId = function() {
        return this.roleId;
    };

    /**
     * Get the role name
     * @returns {String} The name of the role
     */
    AssignedRole.prototype.getName = function() {
        return this.name;
    };

    /**
     * Get the name of the assigner
     * @returns {String} The name of the assigner
     */
    AssignedRole.prototype.getAssigner = function() {
        return this.assigner;
    };

    /**
     * Get the assignment note
     * @returns {String} The assignment note
     */
    AssignedRole.prototype.getAssignmentNote = function() {
        return this.assignmentNote;
    };

    /**
     * Get the create date
     * @returns {Date} The created date
     */
    AssignedRole.prototype.getCreated = function() {
        return this.created;
    };
    
    return AssignedRole;
});