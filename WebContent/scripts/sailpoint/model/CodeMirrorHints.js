 /* (c) Copyright 2014 SailPoint Technologies, Inc., All Rights Reserved. */
'use strict';
 /* global CodeMirror */

/**
 * @author: michael.hide
 * Created: 6/16/14 12:31 PM
 */

var CodeMirrorHintHelper = {
    container: null,

    // The ExtJs container holding the CodeMirror editor.
    setContainer: function(c) {
        CodeMirrorHintHelper.container = c;
    },

    getOffsets: function() {
        if (CodeMirrorHintHelper.container) {
            return {left: CodeMirrorHintHelper.container.getLeft() + 5, top: CodeMirrorHintHelper.container.getTop()};
        }
        return {left: 0, top: 0};
    },

    completeAfter: function(cm, pred) {
        if (!pred || pred()) {
            setTimeout(function() {
                if (!cm.state.completionActive) {
                    cm.showHint({
                        completeSingle: false,
                        container: CodeMirrorHintHelper.container,
                        offsets: CodeMirrorHintHelper.getOffsets()
                    });
                }
            }, 100);
        }
        return CodeMirror.Pass;
    },

    completeIfAfterLt: function(cm) {
        return CodeMirrorHintHelper.completeAfter(cm, function() {
            var cur = cm.getCursor(null);
            return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) === '<';
        });
    },

    completeIfInTag: function(cm) {
        return CodeMirrorHintHelper.completeAfter(cm, function() {
            var tok = cm.getTokenAt(cm.getCursor(null));
            if (tok.type === 'string' && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) ||
                tok.string.length === 1)) {
                return false;
            }
            var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
            return inner.tagName;
        });
    }
};

/**
 * This object is used by the show-hint addon to build contextual hints. Each entry should be in the form:
 * <object name>: {
 *     attrs: {
 *         key: null, // null for any value
 *         key: [] // array for limited list of possible values
 *     },
 *     children: [array of names of child objects]
 * }
 *
 * NOTE: some keys must be enclosed in quotes (namely 'class') or else IE will puke.
 */
var CodeMirrorSailpointObjects = {
    ApplicationRef: {children: ['Reference']},
    Argument: {attrs: {name: null, type: null, filterString: null, helpKey: null, inputTemplate: null, description: null, prompt: null, defaultValueAsString: null, required: ['true', 'false'], multi: ['true', 'false']}, children: ['Description']},
    Attributes: {children: ['Map']},
    AttributeDefinition: {attrs: {remediationModificationType: ['None', 'Select', 'Freetext'], name: null, type: null}},
    AttributeSource: {attrs: {name: null, key: null}, children: ['ApplicationRef', 'RuleRef']},
    ColumnConfig: {attrs: {headerKey: null, property: null, name: null, dataIndex: null, sortProperty: null, secondarySort: null, sortable: ['true', 'false'], hideable: ['true', 'false'], hidden: ['true', 'false'], noEscape: ['true', 'false'], localize: ['true', 'false'], editorClass: null, dateStyle: ['short', 'long', 'full', 'medium'], timeStyle: ['short', 'long', 'full', 'medium'], flex: null, fieldOnly: ['true', 'false'], evaluator: null, stateId: null}},
    entry: {attrs: {key: null, value: null}, children: ['value']},
    Inputs: {children: ['Argument']},
    Map: {children: ['entry']},
    Message: {attrs: {key: null, type: null}},
    ObjectConfig: {attrs: {created: null, id: null, name: null, modified: null}, children: ['ObjectAttribute']},
    ObjectAttribute: {attrs: {displayName: null, editMode: null, extendedNumber: null, name: null, type: ['int', 'long', 'boolean', 'string', 'date', 'permission', 'secret', 'script']}},
    Owner: {children: ['Reference']},
    QuickLink: {attrs: {action: null, bulk: ['true', 'false'], category: null, disabled: ['true', 'false'], icon: null, name: null, messsageKey: null, ordering: null}},
    Reference: {attrs: {'class': null, id: null, name: null}},
    RequestDefinition: {attrs: {id: null, name: null, executor: null, created: null, type: null, retryMax: null, retryInterval: null}},
    Rule: {attrs: {id: null, name: null, description: null, language: null, type: null, attributes: null, created: null, modified: null}, children: ['Signature', 'Source']},
    RuleRef: {children: ['Reference']},
    Server: {attrs: {created: null, heartbeat: null, inactive: null, modified: null, name: null}},
    Signature: {attrs: {description: null, returnType: null}, children: ['Inputs', 'Returns']},
    TaskDefinition: {attrs: {name: null, type: null, executor: null, template: null, resultRenderer: null, resultAction: ['Delete', 'Rename', 'RenameNew', 'Cancel'], concurrent: ['true', 'false']}},
    value: {children: ['Map', 'Integer', 'Boolean', 'Long', 'List', 'TimeDuration', 'SelfCertificationAllowedLevel', 'CertificationStatus', 'SMSResetConfig']},
    WorkItem: {attrs: {name: null, description: null, handler: null, renderer: null, targetClass: null, targetId: null, targetName: null, type: null, state: null, level: null, completionComments: null, notification: null, expiration: null, wakeUpDate: null, reminders: null, escalationCount: null, notificationConfig: null, attributes: null, ownerHistory: null, certification: null, certificationEntity: null, certificationItem: null, identityRequestId: null}, children: ['Description', 'Owner', 'Requestor']}
};
