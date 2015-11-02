
Ext.define('SailPoint.DecisionMenu', {
	extend : 'Ext.Button',

    showAddComment : false,
    showHistory : false,
    canEditDecision : false,
    isReadOnly : true,
    showRemediationDialog : false,
    requireApprovalComments : false,
    provisionMissingRoles : false,
    currentDecision: null,

    menu : null,


    constructor : function(config) {

        // set our default class
        config.cls = config.cls ? config.cls + ' decisionMenu' : 'decisionMenu';
        config.cls += " decisionButton";

        if (config.disabled)
            config.cls += " disabled";

        // Set a button class for the given action
        config.cls += " " + config.action + "Button";

        //config.tooltip= "Approve this item";

        Ext.apply(this, config);
        this.callParent(arguments);
    },

    initComponent : function() {

        this.addEvents(
            'addComment',
            'showHistory',
            'viewWorkItem',
            'editDecision',
            'viewDecision',
            'undoDecision'
        );

        this.on('click', function(button, eventObj){
            if (this.disabled)
                return;
            this.initMenu();
            this.menu.show(button.getEl());
        }, this);

        // Handle hover state
        this.on('mouseover', function(button){
            this.addCls("disabled");
        }, this);
        this.on('mouseout', function(button){
            if (!this.disabled)
                this.removeCls("disabled");
        }, this);

        SailPoint.DecisionMenu.superclass.initComponent.apply(this, arguments);
    },



    initMenu:function(){

        if (!this.menu){

            this.menu = new Ext.menu.Menu({
                minWidth: 200
            });

            this.menu.add(new Ext.menu.Item({
                text: '#{msgs.menu_details}',
                handler: function(){
                    this.fireEvent('viewDecision');
                },
                scope: this,
                iconCls: 'viewDetailsBtn'
            }));

            if (this.showHistory) {
                this.menu.add(new Ext.menu.Item({
                    text: '#{msgs.menu_view_history}',
                    handler: function(){
                        this.fireEvent('viewHistory');
                    },
                    scope: this,
                    iconCls: 'viewHistoryBtn'
                }));
            }

            if (this.showAddComment) {
                this.menu.add(new Ext.menu.Item({
                    text: '#{msgs.menu_add_comment}',
                    handler: function(){
                        this.fireEvent('addComment');
                    },
                    scope: this,
                    iconCls: 'addCommentBtn'
                }));
            }

            if (!this.isReadOnly && this.currentDecision)
            {
                if (this.currentDecision.isDelegated()) {
                    this.menu.add(new Ext.menu.Item({
                        text: '#{msgs.menu_details}',
                        handler: function(){
                            this.fireEvent('viewDecision');
                        },
                        scope: this,
                        iconCls: 'viewDetailsBtn'
                    }));
                }else if (this.canEditDecision  && ((!this.currentDecision.isRemediated()) || this.showRemediationDialog)
                        && (!this.currentDecision.isApproved() || this.requireApprovalComments || this.provisionMissingRoles)) {
                    this.menu.add(new Ext.menu.Item({
                        text: '#{msgs.menu_edit}',
                        handler: function(){
                            this.fireEvent('viewDecision');
                        },
                        scope: this,
                        iconCls: 'editBtn'
                    }));
                }

                if (this.canEditDecision) {
                    this.menu.add(new Ext.menu.Item({
                        text: '#{msgs.menu_undo_decision}',
                        handler: function(){
                            this.fireEvent('editDecision');
                        },
                        scope: this,
                        iconCls: 'undoBtn'
                    }));
                }
            }
        }
    },

    handleDecision : function(newDecision){
        this.currentDecision = newDecision;
    }
});
