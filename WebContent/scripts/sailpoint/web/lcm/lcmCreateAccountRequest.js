Ext.ns('SailPoint', 'SailPoint.LCM', 'SailPoint.LCM.RequestAccess');
SailPoint.LCM.RequestAccess.OP = "Modify";
SailPoint.LCM.RequestAccess.ADD = "Add";
SailPoint.LCM.RequestAccess.MODIFY = "Modify";
SailPoint.LCM.RequestAccess.REMOVE = "Remove";
SailPoint.LCM.RequestAccess.DELETE = "Delete";
SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_REMOVE = SailPoint.LCM.RequestAccess.REMOVE;
SailPoint.LCM.RequestAccess.ATTRIBUTE_OP_ADD = SailPoint.LCM.RequestAccess.ADD;
SailPoint.LCM.RequestAccess.APP = "IIQ";
SailPoint.LCM.RequestAccess.DETECTED = "detectedRoles";
SailPoint.LCM.RequestAccess.ASSIGNED = "assignedRoles";

SailPoint.LCM.RequestAccess.OBJECT_TYPE_ROLE = "role";
SailPoint.LCM.RequestAccess.OBJECT_TYPE_ENTITLEMENT = "entitlement";

SailPoint.LCM.RequestAccess.createCartRemoveRequest = function (record) {
    var request = new SailPoint.AccountRequest();
    request.operation = SailPoint.LCM.RequestAccess.DELETE;
    request.arguments.id = record.getId();
    request.requestId = record.getId();
    return request;
};

SailPoint.LCM.RequestAccess.createAccountRequestFromRecord = function (op, record, type) {
    var request = new SailPoint.AccountRequest();
    request.operation = SailPoint.LCM.RequestAccess.MODIFY;
    request.application = SailPoint.LCM.RequestAccess.APP;
    request.trackingId = SailPoint.LCM.RequestAccess.identityId;

    /** Add interesting stuff to the arguments **/
    request.arguments.id = record.getId();
    request.arguments.action = op;
    request.type = type;

    var attribute = new SailPoint.AttributeRequest();
    attribute.operation = op;

    var name = record.get('displayableName');
    if (!name || name === 'null') {
        name = record.get('attribute');
    }

    if (request.type !== 'entitlement') {
        request.arguments.name = record.get('name');
        request.arguments.displayableName = name;
        request.arguments.description = record.get('description');
        request.arguments.owner = record.get('owner-displayName') || '';

        attribute.valueXmlAttribute = record.raw.name;

        if (record.get('detectedOrAssigned')) {
            attribute.name = record.get('detectedOrAssigned');
        } else if (record.get('type')) {
            var roleType = record.get('type');
            if (SailPoint.LCM.RequestAccess.assignableTypes.indexOf(roleType) >= 0) {
                attribute.name = SailPoint.LCM.RequestAccess.ASSIGNED;
            } else {
                attribute.name = SailPoint.LCM.RequestAccess.DETECTED;
            }
        }

        //Need to set this regardless of assignmentId because we override id on detectedRoles
        request.arguments.roleId = record.get('roleId');
        if (!Ext.isEmpty(record.get('assignmentId'))) {
            attribute.assignmentId = record.get('assignmentId');
        }
    } else {
        request.attributeOpName = record.get('value');
        request.displayValue = name;
        request.attributeOp = SailPoint.LCM.RequestAccess.ADD;
        request.value = record.get('value');
        request.application = record.get('application-name');
        request.nativeIdentity = record.get('nativeIdentity');

        request.arguments.displayableName = name;
        request.arguments.description = record.get('description');
        request.arguments.owner = record.get('owner-displayName') || '';

        attribute.valueXmlAttribute = record.get('value');
        attribute.name = record.get('attribute');
    }

    attribute.operation = op;

    request.addAttribute(attribute);

    return request;
};
