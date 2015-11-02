
Ext.define('SailPoint.DecisionButtonGroup', {
	extend : 'Ext.Component',

    certItem : null,

    buttonsDisabled : false,

    /**
     * List of image radios included in this group
     */
    items:[],

    gridId : null,
    rowIdx : null,

    // List of status allowed for this item. ie Delegated, Approved, etc.
    //allowedStatuses:[],

    decisionWidth:0,
    

    constructor : function(config) {
        config.layout = "column";

        Ext.apply(this, config);
        this.callParent(arguments);

        var decider = SailPoint.Decider.getInstance();

        decider.on('decide', this.decide, this);
        decider.on('revert', this.revert, this);

        decider.on('save', this.handleSave, this);
        decider.on('clearAll', this.clear, this);

        decider.on('invalidItems', this.revertInvalidItems, this);

    },

    init : function(record){
        try{
            this.certItem = null;
            this.record = record;
            if (record){
                SailPoint.DecisionButtonGroup._instances[record.get("id")] = this;
                this.certItem = new SailPoint.CertificationItem(record, this.gridId);
                SailPoint.Decider.getInstance().addCertificationItem(this.certItem);
            }
        } catch(err){
            if (!SailPoint.DecisionGroupConstrErr){
                alert(err);
                SailPoint.DecisionGroupConstrErr = true;
            }
        }
    },

    getItemId : function(){
        return this.certItem.getId();
    },

    getGridId : function(){
        return this.gridId;
    },

    /**
     * Generates the html for the decision radio buttons. Doing this here
     * instead of using component rendering because it's much more
     * responsive in the worksheet grid.
     */
    generateHtml : function(showMenu,certConf, currentStatus){

        var decisions = this.certItem.getDecisions();

        var buttonsDisabled = this.buttonsDisabled;

        // Create our callbacks that will take care of special rendering.
        var callbacks = {
          selected: function(label, thisClass, record) {
              // todo jfb  - might be nice to cache this lookup since
              // we will have to make it multiple times per row
              var unsavedDecision = SailPoint.Decider.getInstance().findDecisionById(record.get("id"));

              if (unsavedDecision) {
                return (unsavedDecision.status === label) || (unsavedDecision.status === "Reassign" && label === "Delegated");
              }else {
                return (record.get('IIQ_decisionChoices').currentState==label);
              }
          },          
          
          disabled: function(label, thisClass, record) {
              var decisions = record.get('IIQ_decisionChoices');
              return buttonsDisabled || (decisions.canChangeDecision !== true);
          },

          onclick: function(label, thisClass, record) {
              return "SailPoint.DecisionButtonGroup.handleClick(this, '"+record.get("id")+"', ImageRadio.getRadio(this).value)";
          },

          extraStuff: function(record) {
              var decisions = record.get('IIQ_decisionChoices');
              if (decisions.actionRequired===true) {
                  return '<td width="23px" id="delegationReview_'+record.get("id")+'"><img src="'+CONTEXT_PATH + '/images/icons/icon_Star.png"></td>';
              }
              return '';
          }
        };

        var radioValues = [];
        var allowsDelegation = false;
        for(var i=0;i<decisions.length;i++){
            var status = decisions[i].status;
            if (status == "Delegated")
                allowsDelegation = true;
            var radio = {
                label:status,
                value:status + 'Radio'
            };
            radioValues.push(radio);
        }

        // If line-item delegations are not allowed, we may
        // still need the icon if the user makes a reassignment
        // Include a hidden delegation icon for reassignments
        // that we can display for reassignments.
        if (!allowsDelegation){
            var radio = {
                label:"Delegated",
                value: 'DelegatedRadio',
                hidden:true
            };
            radioValues.push(radio);
        }

        var radioHtml = "<div style='float:left'>" + ImageRadio.render(radioValues, 'itemDecision', callbacks, this.record) + "</div>";

        // The menu ID and certItemMenu class are used by CertificationItemMenu.js to generate the cert menus.
        var menuId = "menu_" + this.id;
        var onclick = "SailPoint.CertificationItemMenu.handleClick(this, '"+ this.record.get('id') +"', '"+this.id+"')";
        var isDisabled = !currentStatus &&
                (certConf.type == 'AccountGroupPermissions' || certConf.type == 'BusinessRoleComposition');
        var menuClass="certItemMenu" + (isDisabled ? " menuDisabled disabledOnEmpty" : "");
        var menuHtml = showMenu ? '<div id="'+menuId+'" onclick="'+onclick+'" class="certItemMenu '+menuClass+'" ' +
                'style="float:left"></div>' : '';

        var outerDiv = Ext.String.format('<div id="{0}">', "container_" + this.id);
        var outerDivPost = '</div>';

        return outerDiv + menuHtml + radioHtml + outerDivPost;
    },

    /**
     * Updates the decision buttons with the details of the
     * given decision.
     * @param decision {SailPoint.Decision}
     */
    decide: function(decision){
        if (!this.isActive()){
            return;
        }

        var actvieDecision = SailPoint.Decider.getInstance().findDecision(this.certItem);
        if (this.certItem.isEditable() || decision.status == SailPoint.Decision.STATUS_UNDO_DELEGATION ){
            if (decision.includes(this.certItem)){

                this.prevDecision = decision;
                this.setDecision(decision);

                if (decision.status == "Reassign"){
                    var container = this.getContainer();
                    if( container == null ) {
                    	return;
                    }
                    var delegatedButtons = Ext.query(".DelegatedRadio", container.dom);
                    Ext.fly(delegatedButtons[0]).show();
                }

                // Mark the item's row with a style to indicate that it is included in an usaved decision.
                // If we're undoing an unsaved decision, we can skip setting the saved state
                this.setRowSavedState(!decision.isUndo() || this.certItem.getCurrentStatus() != null);
            }else if (decision.causesUndo(this.certItem, actvieDecision)){
                this.setDecision(null);
                var savedDecision = SailPoint.Decider.getInstance().getSavedDecision(this.certItem);
                this.setRowSavedState(savedDecision != null);
            }
        }
    },

    revert : function(decision){
        if (!this.isActive()){
            return;
        }

        if (decision.includes(this.certItem)){
            this.clear();
        }
    },

    revertInvalidItems : function(itemIdList){
        if (!this.isActive() || !itemIdList || itemIdList.length == 0){
            return;
        }

        if (itemIdList.indexOf(this.certItem.getId() > -1)){
            this.clear();
        }
    },

    /**
     * Called by the decider when a save occurs.
     */
    handleSave : function(saveResponse){
        this.setRowSavedState(false);
    },

    /**
     * Resets the  row style if the item has an unsaved decision. This is used
     * when a certification grid is updated.
     */
    updateRowState : function(){
        if (this.isActive()){
            var decision = SailPoint.Decider.getInstance().findDecisionById(this.record.getId());
            if (decision && !decision.isSaved()) {
                this.setRowSavedState(true);
            }
        }
    },


    // ------------------------------------------------------
    //
    //  Private Methods
    //
    // ------------------------------------------------------

    /**
     * Handles internal details of applying the given decision to the current
     * group of decision buttons.
     * @orivate
     */
    setDecision : function(decision){
        var container = this.getContainer();

        if (!container)
            return;

        var radio = ImageRadio.getRadio(container.dom);

        var status = decision ? decision.status : null;

        if (decision && decision.isReassign()){
            status = SailPoint.Decision.STATUS_DELEGATED;
        }

        if (status != null && status !== SailPoint.Decision.STATUS_UNDO){
            var menuSelect = Ext.select('.menuDisabled', true, container.dom);
            if (menuSelect.getCount() > 0){
                menuSelect.first().removeCls('menuDisabled');
            }
        } else {
            var menuSelect = Ext.select('.disabledOnEmpty', true, container.dom);
            if (menuSelect.getCount() > 0){
                menuSelect.first().addCls('menuDisabled');
            }
        }

        // Delegation review acceptance decisions don't affect the decision icon.
        if (status != SailPoint.Decision.STATUS_DELEGATION_REVIEW_ACCEPT){
            RadioProxy.setRadioValue(radio, status);
        }
    },

    clear : function(){
        if (!this.isActive()){
            return;
        }
        var oldDecision = SailPoint.Decider.getInstance().getCurrentDecision(this.certItem.getId());
        this.setDecision(oldDecision);
        this.prevDecision = oldDecision;
        this.setRowSavedState(false);
    },

    /**
     *
     * @private
     */
    getContainer : function(){
        return Ext.get("container_" + this.id);
    },

    /**
     *
     * @private
     */
    getRow : function(){
        return this.getGrid().getView().getRow(this.rowIdx);
    },

    /**
     *
     * @private
     */
    getGrid : function(){
        return Ext.getCmp(this.gridId);
    },

    /**
     * Returns true if the button group is currently active.
     * An inactive button group, is one that was created on a previous
     * page, but is not currently being used because the number of
     * rows visible on the page has decreased.
     * @private
     */
    isActive : function(){
        return this.getGrid().getStore().getById(this.record.getId()) != null;
    },

    /**
     *
     * @private
     */
    revertToLastDecision : function(){
        this.setDecision(this.currentDecision);
    },

    /**
     * Sets the correct style on the row depending on whether the
     * item has an unsaved decision or not.
     * @private
     */
    setRowSavedState : function(isUnsaved){
        var record = this.getGrid().getStore().getById(this.certItem.getId());

        if (isUnsaved)
            this.getGrid().getView().addRowCls(record, 'grid-row-unsaved');
        else
            this.getGrid().getView().removeRowCls(record, 'grid-row-unsaved');
    },

    /**
     * todo this doesnt appear to be used
     * @private
     */
    getRadioStatus:function(){
        var container = this.getContainer();
        var radio = ImageRadio.getRadio(container.dom);
        return radio ? ImageRadio.getRadioValue(radio) : null;
    }

});

SailPoint.DecisionButtonGroup.CMP_ID_PREFIX = 'decisionGrp-';
SailPoint.DecisionButtonGroup.DEFAULT_BUTTON_WIDTH = 27;


SailPoint.DecisionButtonGroup._instances = {};

SailPoint.DecisionButtonGroup.getInstance = function(itemId){
    return SailPoint.DecisionButtonGroup._instances[itemId];
};

SailPoint.DecisionButtonGroup.handleClick = function(radio, recordId, newStatus){

    if (ImageRadio.radioClickCanceled) {
        ImageRadio.radioClickCanceled = false;
        return false;
    }

    var decisionGroup = SailPoint.DecisionButtonGroup.getInstance(recordId);
    var decider = SailPoint.Decider.getInstance();

    var result = decider.decide(decisionGroup.getItemId(), newStatus);

    return true;
};