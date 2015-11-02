/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.Decider', {
	extend : 'Ext.util.Observable',

    /**
     * @config List of the IDs of the Grids the Decider is associated with.
     * This is used interact with the grids when decisions are
     * being processed. The is also used when create a new entity
     * bulk decision
     */
    gridIds : null,

    /**
     * @config Current workitem ID. This will be null unless we're in
     * an entity delegation.
     */
    workItemId : null,

    /**
     * @config Basic info about the cert currently being worked upon.
     */
    certificationConfig:null,

    /**
     * @config Indicates whether the second pass data should be loaded.
     * This can be disabled if the certification is not editable
     */
    doLoadSecondPass:true,

    /**
     * @config True if we're on the entity list page (formerly known as the identity
     * view). On that page, all decisions are automatically saved once made.
     */
    entityListMode : false,


    /**
     * @private EXT Store used to store the decisions before they are
     * saved to the server.
     */
    decisionStore : null,
    
    /**
     * @private Indicates that we should skip the warning dialog that changes are unsaved
     * methods will set this using the skipWarnUnsaved() method
     */
    skipWarning : false,

    certItems : [],

    // ----------------------------------------------------------------------
    //
    // Constructor
    //
    // ----------------------------------------------------------------------

    constructor : function(config) {
    	config = config || {};
    	
        config.id = "decider";
        Ext.apply(this, config);
        this.callParent(arguments);

        window.onbeforeunload = this.warnUnsaved;

        this.addEvents(
            /**
             * Fired when a decision had been saved to the decision store.
             * This event is interesting to listeners that must update their
             * own state after the decision is processed. For example, this
             * event is used to alert grids that they can un-check all selected
             * checkboxes since the decision has been processed.
             */
            "decisionProcessed",
            /**
             * Fired when the user discards any existing decisions by hitting
             * the clear button.
             */
            "remove",
            /**
             * Indicates that the number of saved decisions has changed. This
             * event is interesting to listeners that want to display the
             * the number of unsaved decisions.
             * @param Count of items affected by decisions in the store.
             */
            "statusChange",

            /**
             * Fired when all items are flushed from the store.
             */
            "clearAll",

            "cancel",
            
            /**
             * Fired before "save" function is executed.
             * Useful to disable UI before work is done.
             */
            "beforeSave",
            
            /**
             * Fired after "save" function is executed.  
             * Useful for refreshing/re-enabling UI.
             * 
             */
            "afterSave"
            
        );

        this.decisionStore = new Ext.util.MixedCollection({});

        this.decisionStore.getGridIds = function(){
            var distinctGridIds = [];
            this.each(function(item){
                distinctGridIds.concat(item.gridIds);
            });
            return distinctGridIds;
        };
    },

    // ----------------------------------------------------------------------
    //
    // PUBLIC METHODS
    //
    // ----------------------------------------------------------------------

    warnUnsaved : function() {
        var count = SailPoint.Decider.getInstance().getDecisionCount();
        if(count>0 && !this.skipWarning) {
            var message = '#{msgs.cert_unsaved_decisions}',
            e = e || window.event;
            // For IE and Firefox
            if (e) {
              e.returnValue = message;
            }

            // For Safari
            return message;
        }
        
        this.skipWarning = false;
    },
    
    skipWarnUnsaved : function() {
      this.skipWarning = true;
    },

    getCertificationItem : function(id){
        return this.certItems[id];
    },

    addCertificationItem : function(item){
        this.certItems[item.getId()] = item;
    },

    /**
     * Loads second pass information for all the grids on the page.
     */
    loadSecondPass : function(){
        if (this.doLoadSecondPass){
            SailPoint.Certification.CertificationItemSecondPass.loadGrids(this.gridIds,
                    this.certificationConfig.workItemId);
        } else {
            SailPoint.Certification.CertificationItemSecondPass.disable();
        }
    },

    /**
     * Returns true if the decider has at least
     * one unsaved decision.
     */
    hasDecisions : function(){
        return this.getDecisionCount() > 0;
    },

    /**
     * Returns true if the given decision requires a dialog
     * to complete. This lets us know whether the Edit Decision
     * menu item should be shown in the CertificationItemMenu
     */
    requiresDialog : function(decision){
        return this.getDecisionDialog(decision) !== null;
    },

    /**
     *
     * @param itemId The certification item ID.
     * @param decisionGroupId ID of the decisionGroup component for the item
     */
    getCurrentDecision : function(itemId){

        var certItem = this.getCertificationItem(itemId);

        var decision = this.findDecision(certItem);
        if (!decision){
            decision = this.getSavedDecision(certItem);
        }

        return decision;
    },

	unmaskGrids : function() {
        this.gridIds.each(function(gridId){
            var grid = Ext.getCmp(gridId);
            grid.unmask();
        });
	},
	
	retry : function(decisions, isCustom) {
		this.unmaskGrids();
		var lockedHandler = sailpoint.web.manage.certification.LockedCertHandler.getInstance();
		lockedHandler.showRetryDialog(decisions, isCustom);
	},

    isReady : function(status){

        // If we're going to remediate, make sure second pass has loaded
        if (this.doLoadSecondPass && ("Remediated" === status || "RevokeAccount" === status)){
            if (!SailPoint.Certification.CertificationItemSecondPass.isLoaded()){
                Ext.Msg.alert("#{msgs.cert_decision_second_pass_loading_title}", "#{msgs.cert_decision_second_pass_loading}");
                return false;
            }
        }

        return true;
    },

    decide:function(itemId, actionType, isBulk){
        try{
            var certItem = this.getCertificationItem(itemId);

            var isDelegationOrReassign = actionType == "AccountReassign" || actionType == "Reassign" || actionType == "Delegated";

            if (!isDelegationOrReassign && !certItem.isStatusAllowed(actionType)){
                alert("#{msgs.err_action_not_supported}");
                this.finishDecision(this.generateItemDecision(certItem, SailPoint.Decision.STATUS_CANCEL));
                return;
            }

            // Make sure the user is allowed to change the decision. This should
            // Only occur if they select a single item then perform a bulk action.
            if (!certItem.isEditable()){
                alert("#{msgs.err_action_not_editable}");
                this.finishDecision(this.generateItemDecision(certItem, SailPoint.Decision.STATUS_CANCEL));
                return;
            }

            if (!this.isReady(actionType)){
                this.finishDecision(this.generateItemDecision(certItem, SailPoint.Decision.STATUS_CANCEL));
                return;
            }

            // check if the item has an unsaved decision in the
            // client-side decision store
            var currentDecision = this.findDecision(certItem);

            // if we don't have a un-saved decision in the queue, check to see
            // if there's a saved decision on this item
            if (!currentDecision){
                currentDecision = this.getSavedDecision(certItem);
            }

            // if we have a saved or un-saved existing decision for this item
            // with the same action type, we are undo-ing it. This does not
            // apply to bulk decisions.
            if (!isBulk && currentDecision && !currentDecision.isUndo() && currentDecision.isStatusEquivalent(actionType)){
                actionType = SailPoint.Decision.STATUS_UNDO;
            }
            
            var isReassign = actionType == "AccountReassign" || actionType == "Reassign";

            if (isReassign && this.certificationConfig.limitReassign === true) {
                Ext.MessageBox.show ({
                    title:'#{msgs.err_dialog_title}',
                    msg: '#{msgs.err_reassignment_limit_exceeded}',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
                this.finishDecision(this.generateItemDecision(certItem, SailPoint.Decision.STATUS_CANCEL));
                return;
            }

            var decision = this.generateItemDecision(certItem, actionType, currentDecision);

            // store a copy of the old decision. We'll
            // need to know about any existing decisions to determine
            // what dialogs we need to show.
            decision.oldDecision = currentDecision;

            // Reset the dialog state in case we're modifying
            // a previously saved decision.
            decision.reset();

            this.processDecision(decision);
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error performing decision.");
        }
    },

    edit:function(itemId){
        try{

            var currentDecision = this.getDecision(itemId);
            currentDecision.editMitigation = true; 
            this.processDecision(currentDecision);
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error performing decision.");
        }
    },

    view:function(itemId){
        try{

            var currentDecision = this.getDecision(itemId);
            currentDecision.readOnly = true;

            this.processDecision(currentDecision);
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error performing decision.");
        }
    },

    bulkDecide : function(actionType, sourceGridId){

        var sourceGrid = Ext.getCmp(sourceGridId);

        if (!sourceGrid){
            alert("Could not find source grid for decision. Decision canceled..");
        }

        // if the decision is on a single item, just treat it as an individual
        // decision. The one exception being entity classification decisions, since
        // these are always treated as a bulk operation
        var selectionCriteria = sourceGrid.getSelectionCriteria();
        if (actionType != SailPoint.Decision.STATUS_ENTITY_CLASSIFICATION &&
                selectionCriteria.selections && selectionCriteria.selections.length == 1){
            this.decide(selectionCriteria.selections[0], actionType, true);
        } else if (sourceGrid.hasSelection()){
            var decision = this.generateBulkDecision(actionType, sourceGrid);
            var isReassign = actionType == "AccountReassign" || actionType == "Reassign";

            if (isReassign && this.certificationConfig.limitReassign === true) {
                Ext.MessageBox.show ({
                    title:'#{msgs.err_dialog_title}',
                    msg: '#{msgs.err_reassignment_limit_exceeded}',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
                decision.status = SailPoint.Decision.STATUS_CANCEL;
                this.finishDecision(decision);
                return;
            }
            this.processDecision(decision);
        } else {
            Ext.MessageBox.alert('#{msgs.cert_bulk_action_title_none_selected}',
                    '#{msgs.cert_bulk_action_none_selected}');
        }
    },

    delegateEntity : function(actionType, sourceGridId, record) {
        var sourceGrid = Ext.getCmp(sourceGridId);
        if (!sourceGrid){
            alert("Could not find source grid for decision. Decision canceled..");
        }
        
        if(record) {
                   
            var decision =  new SailPoint.Decision({id:"entity-decision", entityDecision:true,
                certificationId:this.certificationConfig.certificationId,
                workItemId:this.certificationConfig.workItemId,
                status:actionType, gridIds:[sourceGrid.getId()],
                selectionCriteria:new SailPoint.SelectionCriteria({
                    selections:new Array(record.getId()),
                    exclusions:new Array(),
                    selectAll:false
                })
            });
            this.processDecision(decision);
        }
        else {
            Ext.MessageBox.alert('#{msgs.cert_bulk_action_title_none_selected}',
                    '#{msgs.cert_bulk_action_none_selected}');
        }
    },

    /**
     * Make an entity decision from the grid view
     */
    entityDecide: function(actionType, sourceGridId){
        var sourceGrid = Ext.getCmp(sourceGridId);
        if (!sourceGrid){
            alert("Could not find source grid for decision. Decision canceled..");
        }

        if (sourceGrid.hasSelection()){
            var decision = this.generateEntityDecision(actionType, sourceGrid);
            var isReassign = actionType == "Reassign";

            if (isReassign && this.certificationConfig.limitReassign === true) {
                Ext.MessageBox.show ({
                    title:'#{msgs.err_dialog_title}',
                    msg: '#{msgs.err_reassignment_limit_exceeded}',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
                decision.status = SailPoint.Decision.STATUS_CANCEL;
                this.finishDecision(decision);
                return;
            }
            this.processDecision(decision);
        } else {
            Ext.MessageBox.alert('#{msgs.cert_bulk_action_title_none_selected}',
                    '#{msgs.cert_bulk_action_none_selected}');
        }
    },

    /**
     * This action is only generated by clicking one of the bulk
     * decision buttons at the top of the entity detail view. The decision
     * only applies to items which do not yet have a decision.
     *
     * @param actionType Name of action being made
     * @param currentEntityId ID of the entity being decided
     */
    bulkEntityDecide : function(actionType, currentEntityId){
        var selCriteria = new SailPoint.SelectionCriteria({
            selectAll: true,
            filter: this.getBulkEntityFilter(currentEntityId, SailPoint.Decision.SCOPE_ITEM)
        });

        var decision =  new SailPoint.Decision({
            id: currentEntityId,
            workItemId: this.certificationConfig.workItemId,
            certificationId: this.certificationConfig.certificationId,
            status: actionType,
            entityDecision: true,
            entityId: currentEntityId,
            decisionScope: SailPoint.Decision.SCOPE_ITEM,
            gridIds: this.gridIds,
            selectionCriteria: selCriteria
        });

        // If this is a bulk undo and we've got some active line item delegations on the entity, we need to
        // warn the user the they will be revoking delegations.
        if (actionType == SailPoint.Decision.STATUS_UNDO_DELEGATION ||
                (actionType == SailPoint.Decision.STATUS_UNDO && SailPoint.CurrentEntityDetails.activeDelegations > 0)){
            decision.requiresDelegationRevoke = true;
            decision.recipient = SailPoint.CurrentEntityDetails.currentDelegationOwner;
        }

        this.processDecision(decision);
    },

    delegationReview : function(itemId){
        try{
            var certItem = this.getCertificationItem(itemId);
            var currentDecision  = this.getSavedDecision(certItem);
            currentDecision.requiresDelegationReview = true;
            this.processDecision(currentDecision);
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error performing delegation review.");
        }
    },

    challenge : function(itemId){
        try{
            var certItem = this.getCertificationItem(itemId);
            var currentDecision  = this.getSavedDecision(certItem);
            currentDecision.showChallengeDialog = true;
            this.processDecision(currentDecision);
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error performing delegation review.");
        }
    },

    findDecision : function(certItem){

        // first see if we can find an individual decision for this item.
        var i, decision = this.decisionStore.get(certItem.getId());

        // If we can't locate the item by ID, check to see if it's
        // included in a bulk decision
        if (!decision) {
            // Bug #21166: This is a subtle change from the previous loop.
            // Previously we were looping over the items in decisionStore with the built-in
            // Ext.store.each() function, but for some reason it wasn't behaving as documented.
            // Instead of looping over ALL the items in the store, it would loop until it found a match
            // and then stop, regardless of the return value.  By breaking this out into a for loop we
            // can guarantee that all items are iterated.  This way, the most recent store that matches
            // will win, which under most circumstances seems to be what we want.
            for (i = 0; i < this.decisionStore.length; i++) {
                if (this.decisionStore.items[i].includes(certItem)) {
                    decision = this.decisionStore.items[i];
                }
            }
        }

        return decision ? decision.clone() : null;
    },

    findDecisionById : function(id){
        return this.findDecision(this.getCertificationItem(id));
    },

    /**
     * Find a decision for an item when we do not have a CertificationItem object.
     *
     * @param itemId ID of the CertificationItem
     * @param entityId ID of the CertificationEntity
     * @param accountKey Generated account key
     * @param allowedStatuses List of statuses allowed for the item type
     */
    findDecisionByItemProperties : function(itemId, entityId, accountKey, allowedStatuses){
        var decision = this.decisionStore.get(itemId);
        if (decision){
            this.decisionStore.each(function(storedDecision, idx, len){
                var criteria = storedDecision.selectionCriteria;
                if (!decision && criteria && criteria.includesItemId(itemId) &&
                        allowedStatuses.indexOf(storedDecision.status) > -1){
                    decision = storedDecision;
                }
            }, this);
        }

        return decision;
    },

    /**
    * Clears all un-saved decisions
    */
    removeAll: function(){
        if (this.decisionStore){
            this.decisionStore.each(function(item, idx, len){
                this.removeDecision(item);
                item.status = null;
            }, this);
            this.fireEvent("statusChange", this.decisionStore.getCount());
        }
        this.fireEvent("clearAll");

        // Re-show any delegation review links that we've hidden as part
        // of a decision
        Ext.query('.delegationReview').each(function(item){
            Ext.fly(item).show();
        });
    },

    /**
     * Clear the store without notifying listeners. THis is useful
     * in cases where we need to clear out all the records but don't
     * want to update all the decision groups.
     */
    flush: function(){
        if (this.decisionStore){
            this.decisionStore.each(function(item, idx, len){
                this.removeDecision(item);
            }, this);
        }
    },

    /**
    * Sends all unsaved decisions to the server, locking the grid
    * temporarily.
    */
    save: function(){

        var decisions = [];
        this.decisionStore.each(function(item){

            // sending the entire decision is a little verbose since
            // not all object properties are interesting on the backend.
            // this trims the decision down to just what the server needs.
            var itemMsg = {
                entityDecision : item.entityDecision,
                decisionScope: item.decisionScope,
                status: item.status,
                itemType: item.itemType,
                workItemId: item.workItemId,
                recipient: item.recipient,
                selectionCriteria: item.selectionCriteria,
                comments: item.comments,
                addRoles: item.addRoles,
                remediationDetails: item.remediationDetails,
                mitigationExpirationDate: item.mitigationExpirationDate,
                mitigationExpiresNextCert: item.mitigationExpiresNextCert,
                custom: item.custom,
                delegationReview: item.delegationReview,
                revokeDelegation: item.revokeDelegation,
                revokeEntityDelegation: item.revokeEntityDelegation,
                undo: item.undo,
                description: item.description,
                provisionMissingRoles: item.provisionMissingRoles,
                revokedRoles: item.revokedRoles,
                challengeAction: item.challengeAction,
                challengeComments: item.challengeComments,
                bundleAssignmentId: item.bundleAssignmentId,
                // the backend expects a string not an object so encode it
                selectedViolationEntitlements: item.selectedViolationEntitlements != null ?
                        Ext.encode(item.selectedViolationEntitlements) : null
            };

            decisions.push(itemMsg);
        });

        this.persist(decisions, false);
    },
    
    updateStatusWidget : function(respObj) {
      // We used to try to update the individual summary elements using javascript.
      // It turned out to be more complicated than anticipated, so we're reverting
      // back to an a4j refresh for now.
      if ($('editForm:rerenderCertificationSummaryBtn'))
          $('editForm:rerenderCertificationSummaryBtn').click();

      if (respObj.readyForSignoff && this.certificationConfig.promptForSignOff == true){
          showSignCertificationWindow(this.certificationConfig.certificationId, 
                                      this.certificationConfig.signatureMeaning,
                                      this.certificationConfig.originalAuthId,
                                      this.certificationConfig.nativeAuthId);
      }
    },

    // ----------------------------------------------------------------------
    //
    // PRIVATE METHODS
    //
    // ----------------------------------------------------------------------

    /**
     * Given an item ID, either looks up the current decision
     * in the decisionStore, or generates a new decision based on
     * the saved state of the Item.
     */
    getDecision : function(itemId){
        var certItem = this.getCertificationItem(itemId);

        // check if the item has an unsaved decision
        var currentDecision = this.findDecision(certItem);


        // if we don't have a un-saved decision in the queue, check to see
        // if there's a saved decision on this item
        if (!currentDecision){
            currentDecision = this.getSavedDecision(certItem);
        }

        return currentDecision;
    },

    /**
     * @private
     */
    getGridFilter : function(){
        //Bug 11655 - Return null for empty filter value to get around IE8 bug
        if ($('certificationFilterString') && $('certificationFilterString').value != ""){
            return $('certificationFilterString').value;
        }
        return null;
    },

    /**
     * @private
     */
    processDecision : function(decision){
        try{
            var requiredCommentField;
            // Check to make sure we have at least one selected item. It's possible
            // that all the items were filtered out, This could happen if all the items
            // selected by the user were not editable.
            if (decision.selectionCriteria.isEmpty()){
                decision.status = SailPoint.Decision.STATUS_CANCEL;
                this.finishDecision(decision);
            }

            var decisionDialog = this.getDecisionDialog(decision);
            if (decisionDialog){
                decisionDialog.on('finish', this.processDecision, this);
                var item = null;
                if (!decision.isBulk()){
                    var itemId = decision.selectionCriteria.selections[0];
                    item = this.getCertificationItem(itemId);
                }
                decisionDialog.display(decision, item, this.certificationConfig);

                if(decisionDialog.form) {
                    requiredCommentField = decisionDialog.form.down('#requiredComments');
                    if(requiredCommentField) {
                        requiredCommentField.focus();
                    }
                }
            } else if (decision) {

                // Before we go further, flush any dialog state
                // set on the decision
                decision.reset();

                this.finishDecision(decision);
            }
        }catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error processing decision.");
            decision.status = SailPoint.Decision.STATUS_CANCEL;
            this.finishDecision(decision);
        }
    },

    /**
     * At this point the user has responded to all the popup dialogs we
     * needed them to respond to, so we can go ahead and process the decision.
     *
     * @private
     */
    finishDecision : function(decision){
        try{

            // entity classification decisions don't get persisted client side
            // we immediately save these to the server
            if (decision.isEntityClassification()){
                this.saveCustom(decision);
                return;
            }

            // If the user clicked cancel from a dialog, we just need
            // to revert the radio button back to it's original state
            if (decision.isCanceled()){
                this.fireEvent('revert', decision);
                this.fireEvent('decisionProcessed');
                return;
            }

            // Any decision effectively clears a delegation review. This could be either that
            // the user reviewed and approved, or they changed the decision altogether
            if (!decision.isBulk() && Ext.fly('delegationReview_' + decision.selectionCriteria.selections[0])){
                Ext.fly('delegationReview_' + decision.selectionCriteria.selections[0]).hide();
            }

            this.store(decision);

            // on the entity list page we immediately save
            if (!this.entityListMode){
                this.fireEvent('decide', decision);
                this.fireEvent('statusChange', this.getEffectiveDecisionCount());
            } else {
                // When on the entity list page, we just automatically save
                this.save();
            }

            // Let all listeners know that we are done processing
            this.fireEvent('decisionProcessed');
        } catch(err){
            SailPoint.FATAL_ERR_JAVASCRIPT (err, "Error finishing decision.");
        }
    },

    store : function(origDecision){

        // Clone the original decision so we can modify what gets saved
        var decision = origDecision.clone();
        
        // Go through our existing decisions and filter out the items
        // that are affected by this new decision
        var toRemove = [];
        if (decision && decision.selectionCriteria){

            // If we're performing a bulk undo from the detail view, we can wipe
            // out any existing unsaved decisions
            var isEntityUndo = decision.isUndo() && decision.isEntityDecision();

            this.decisionStore.each(function(storedDecision, idx, len){

                // We should never filter out these decisions since they will not be overwritten by
                // another decision
                var unfilterableDecision = storedDecision.status == SailPoint.Decision.STATUS_UNDO_DELEGATION ||
                        storedDecision.isDelegationReviewDecision() || storedDecision.unmatchedEntityDecision(decision);

                // if this is an entity undo, or if we have an ID match
                // there's no need to filter out the criteria
                if (!isEntityUndo && decision.id != storedDecision.id && !unfilterableDecision){
                    storedDecision.selectionCriteria.removeCriteria(decision.selectionCriteria);

                    // If we're making an account level decision, we need to undo any items
                    // that are on that account
                    if ((decision.revertAccountOp || decision.getAccountKeys()) && storedDecision.selectionCriteria.selections){
                        var idsToRemove = [];
                        for(var i=0;i<storedDecision.selectionCriteria.selections.length;i++){
                            var id = storedDecision.selectionCriteria.selections[i];
                            var certItem = this.getCertificationItem(id);
                            if (certItem && certItem.getAccountKey()){
                                if (decision.revertAccountOp == certItem.getAccountKey() ||
                                        decision.getAccountKeys().indexOf(certItem.getAccountKey()) >= 0){
                                    idsToRemove.push(id);
                                }
                            }
                        }

                        if (idsToRemove.length >0){
                            storedDecision.selectionCriteria.removeIds(idsToRemove);
                        }
                    }
                }

                if (storedDecision.selectionCriteria.isEmpty()) {
                    toRemove.push(storedDecision);
                } 
            }, this);
        }

        for(var i=0;i<toRemove.length;i++){
            this.decisionStore.remove(toRemove[i]);
        }
        
        // There's no point in adding an undo operation to the decision
        // store if the current decision has not been saved. Prune out any
        // unsaved decisions
        if (decision.isUndo() && decision.selectionCriteria){
            var selections = decision.selectionCriteria.selections ?
                    decision.selectionCriteria.selections : [];
            if (!decision.selectionCriteria.selectAll && selections.length > 0){
                var toRemove = [];
                for(var i=0; i < selections.length;i++){
                    var id = selections[i];
                    if (decision.isEntityDecision()) {
                        // For entities, we need to look through all the decisions and remove
                        // any for items included in the entity
                        this.decisionStore.each(function(storedDecision, idx, len){
                            // If we have a pre-existing decision for this entity, 
                            // just remove it
                            if (decision.id == storedDecision.id) {
                                this.decisionStore.remove(storedDecision);
                            } 
                            else {
                                // Check if this decision's item is included in the undo
                                var certItem = this.getCertificationItem(storedDecision.id);
                                if (certItem && decision.includes(certItem) && !certItem.getCurrentStatus() ) {
                                    this.decisionStore.remove(storedDecision);
                                }
                            }
                        }, this);
                        
                        // Now we have cleared all the unsaved decisions for the entity, so if there 
                        // are no saved decisions or delegations to undo, we dont need to add this decision to the store.
                        if (SailPoint.CurrentEntityDetails && (SailPoint.CurrentEntityDetails.savedDecisionCount == 0)) {
                            toRemove.push(id);
                        }
                    } else {
                        // For item undos, just look for the matching decision and remove it
                        var certItem = this.getCertificationItem(id);
                        if (certItem && !certItem.getCurrentStatus()){
                            var record = this.findDecision(certItem);
                            if (record && record.id == certItem.getId()) {
                                // If decision exists for same item, we can remove it and lose the 
                                // undo altogether
                                this.removeDecision(record);
                                toRemove.push(id);
                            } 
                        }
                    }
                }

                for(var i=0;i<toRemove.length;i++){
                    decision.selectionCriteria.removeId(toRemove[i]);
                }
            }
        }

        // flag this decision as un-saved
        decision.saved = false;

        // If all the items have been pruned out of the decision, there's no
        // need to save
        if (!decision.selectionCriteria.isEmpty()){

            this.decisionStore.add(decision.id, decision);

            // Add special 'meta-decisions'.
            // - If we're revoking a delegation store a special undo delegation decision. This
            //      decision will be executed before other decisions.
            if (decision.revokeEntityDelegation || decision.revokeDelegation){
                var revokeDelegationDecision = new SailPoint.Decision();
                revokeDelegationDecision.id = 'revDelegation-' + decision.id;
                revokeDelegationDecision.selectionCriteria = decision.selectionCriteria.clone();
                revokeDelegationDecision.decisionScope = decision.decisionScope;
                revokeDelegationDecision.revokeEntityDelegation = decision.revokeEntityDelegation;
                revokeDelegationDecision.revokeDelegation = decision.revokeDelegation;
                revokeDelegationDecision.entityDecision = decision.entityDecision;
                revokeDelegationDecision.status = SailPoint.Decision.STATUS_UNDO_DELEGATION;
                revokeDelegationDecision.workItemId = decision.workItemId;
                this.decisionStore.add(revokeDelegationDecision.id, revokeDelegationDecision);
            }
        }
    },

    /**
     * @private
     */
    getDecisionCount : function(){
        return this.decisionStore.getCount();
    },

    /**
     * Get the number of changes currently in the decision store. Some decisions
     * may not be counted if they are side effects of another decision. For example,
     * changing or clearing a delegation generates two decisions. First the original decision
     * is stored (Approve, Revoke, Undo, etc.) then we store a special meta decision which
     * will trigger the delegation revocation. When reporting the number of changes, we can
     * ignore these special decisions.
     *
     * @private
     */
    getEffectiveDecisionCount : function(){

        var count = 0;

        this.decisionStore.each(function(item){
            // If the item is a delegation undo and it's not an entity
            // decision, then the decision is the side effect of another
            // decision and should not be included in the count.
            if (!item.isDelegationUndo() || item.isEntityDecision()){
                count++;
            }
        });

        return count;
    },

    /**
     * @private
     */
    getSavedDecision : function(certItem){
        var status = certItem.getCurrentStatus();

        var decision = null;
        if (status){
            decision = this.generateItemDecision(certItem, status);
            decision.saved=true;
            decision.recipient = certItem.getOwner();
            decision.entityDecision = status === 'Delegated' && certItem.hasEntityDelegation();
        }

        return decision;
    },

    /**
     * @private
     */
    generateItemDecision : function(certItem, actionType, currentDecision){

        var selCriteria = new SailPoint.SelectionCriteria({selections : [certItem.getId()]});

        // If we are making an accoutn decision, or if we are undoing an account operation, include
        // the account id in the selection criteria. This will ensure that any items included
        // in this decision get checked or unchecked
        var undoingAccountOp = currentDecision && actionType == SailPoint.Decision.STATUS_UNDO &&
                currentDecision.isAccountOperation();
        if ((undoingAccountOp || actionType === 'RevokeAccount' || actionType === 'ApproveAccount'
                || actionType === 'AccountReassign')
              && selCriteria.accountKeys.indexOf(certItem.getAccountKey()) < 0) {
            selCriteria.accountKeys.push(certItem.getAccountKey());
        }

        var isDependantDecision = certItem.hasDependantDecisions();
        if (!isDependantDecision){
            this.decisionStore.each(function(decision){
                if (!isDependantDecision){
                    isDependantDecision = decision.isDependantItem(certItem);
                }
            });
        }

        var defaultAssignee = null
        if (actionType === 'AccountReassign' && this.certificationConfig.defaultAccountReassignAssignee != ''){
            defaultAssignee = this.certificationConfig.defaultAccountReassignAssignee;
        }

        return new SailPoint.Decision({
            certificationId:this.certificationConfig.certificationId,
            id:certItem.getId(),
            workItemId:this.certificationConfig.workItemId,
            status:actionType,
            entityId : certItem.getEntityId(),
            itemType:certItem.getItemType(),
            gridIds:[certItem.getGridId()],
            assignedRole : certItem.isAssignedRole(),
            missingRequiredRoles: certItem.isMissingRequiredRoles(),
            parentDelegationId : certItem.getParentDelegationId(),
            selectionCriteria:selCriteria,
            sourceItemId:certItem.getSourceItemId(),
            dependantDecisions:isDependantDecision,
            recipient:defaultAssignee});
    },

    /**
     * @private
     */
    generateEntityDecision : function(actionType, sourceGrid){
        var decision =  new SailPoint.Decision({id:"entity-decision", entityDecision:true,
            certificationId:this.certificationConfig.certificationId,
            workItemId:this.certificationConfig.workItemId,
            status:actionType, gridIds:[sourceGrid.getId()],
            selectionCriteria:sourceGrid.getSelectionCriteria()});

        if (decision.selectionCriteria.selectAll){
            decision.selectionCriteria.filter = this.getGridFilter();
        }

        // If this is a bulk undo or a reassignment check for delegations so we can prompt
        // the user to revoke the delegations
        if (actionType == SailPoint.Decision.STATUS_UNDO || actionType == SailPoint.Decision.STATUS_REASSIGN){
            var hasDelegation = false;
            // if we're selecting all, check to see if the certification
            // includes any line item or entity delegations. Otherwise,
            // check the individual items.
            if (decision.selectionCriteria.selectAll &&
                    this.certificationConfig.delegatedEntityCount > 0){
                hasDelegation = true;
            } else {
                sourceGrid.getSelectionModel().getSelection().each(function(record){
                    // If the decision is undo check for any type of delegation. If the decision is a reassign
                    // we will only remove entity delegations
                    if (actionType == SailPoint.Decision.STATUS_UNDO && record.get('IIQ_hasDelegations') == true){
                        hasDelegation = true;
                    } else if (actionType == SailPoint.Decision.STATUS_REASSIGN && record.raw['delegation']){
                        hasDelegation = true;
                    }
                });
            }

            decision.requiresDelegationRevoke = hasDelegation;
        }

        return decision;
    },

    /**
     * @private
     */
    generateBulkDecision : function(actionType, sourceGrid){
        var id = "bulk-" + Ext.id();
        var decision =  new SailPoint.Decision({id:id,
            certificationId:this.certificationConfig.certificationId,
            workItemId:this.certificationConfig.workItemId,
            status:actionType, gridIds:[sourceGrid.getId()],
            selectionCriteria:sourceGrid.getSelectionCriteria()});

        var decisionRevokesDelegations = false;
        var isUndo = actionType == SailPoint.Decision.STATUS_UNDO;

        if (decision.selectionCriteria.selectAll){
            // If this is a select all, we need to include the filter
            // so that we can construct a query on the server side.
            decision.selectionCriteria.filter = this.getGridFilter();

            // If there are any active delegations, and this is an undo, we need to
            // warn the user that they may revoke some delegations.
            decisionRevokesDelegations = isUndo === true && this.certificationConfig.activeDelegations > 0;
        } else {
            // Check the selected items, if any of them are not editable,
            // we should exclude them from the selection list
            var toRemove = [];
            var delegations = 0;

            for(var i=0;i<decision.selectionCriteria.selections.length;i++){
                var certItem = this.getCertificationItem(decision.selectionCriteria.selections[i]);
                if (!certItem.isEditable()){
                    toRemove.push(certItem.getId());
                }
                // Keep track of any delegations in the selection. We ignore
                // entity delegtions since these are read-only in the worksheet view
                if (certItem.isLineItemDelegated()){
                    delegations++;
                }

                if (decision.selectionCriteria.accountKeys.indexOf(certItem.getAccountKey()) < 0
                      && (actionType === 'RevokeAccount' || actionType === 'ApproveAccount')){
                  decision.selectionCriteria.accountKeys.push(certItem.getAccountKey());
                }
                else if (decision.selectionCriteria.accountKeys.indexOf(certItem.getAccountKey()) >=0) {
                  toRemove.push(certItem.getId());
                }
            }

            toRemove.each(function(id){
                decision.selectionCriteria.removeId(id);
            });

            // If we've removed all the items except one, then change the decision ID to match the ID of
            // the single item selected.
            if (!decision.selectionCriteria.isBulk() && decision.selectionCriteria.selections.length == 1){
                decision.id = decision.selectionCriteria.selections[0];
            }

            decisionRevokesDelegations =  delegations > 0;
        }

        // Set a special flag on the decision so that we can warn the user that
        // they will be revoking one or more delegations. Reassignments dont revoke
        // delegations, so they can be ignored.
        if (decisionRevokesDelegations == true && actionType != SailPoint.Decision.STATUS_REASSIGN){
            decision.requiresDelegationRevoke = true;
        }

        return decision;
    },


    /**
     * Clears the given decision from the store
     * @private
     */
    removeDecision : function(decision){
        var storedDecision = this.decisionStore.get(decision.id);
        if (storedDecision)
            this.decisionStore.remove(storedDecision);
    },

    /**
     * Returns a BaseDecisionDialog instance if the given decision requires some user input.
     *
     * @private
     */
    getDecisionDialog : function(decision){

        var dialog = null;

        if (!decision || decision.isCanceled()){
            return null;
        }

        // Once we've completed a challenge dialog we're done
        if (decision.isDialogComplete('ChallengeDialog'))
            return null;

        if (decision.showChallengeDialog && !decision.isDialogComplete('ChallengeDialog')){
            return SailPoint.certification.ChallengeDialog.getInstance();
        }

        // Look for any warning or confirmation dialogs that should go up before the
        // main decision dialog.
        var requireCountConfirmation = false;
        if (!decision.readOnly){
            if (decision.isRequiresDelegationRevoke() &&
                    !decision.isDialogComplete('DelegationRevocationDialog')){
                return  SailPoint.certification.DelegationRevocationDialog.getInstance();
            }

            if (decision.isRequiresAccountOpConfirmation() && !this.hasExistingAccountOperation(decision)){
                return SailPoint.certification.AccountOpConfirmationDialog.getInstance();
            } else if (decision.isBulk() && ("Remediated" === decision.status || "RevokeAccount" === decision.status)
                         && !decision.isDialogComplete('BulkSelectionCountConfirmationDialog')) {
                //If bulk revoking, show confirmation if affecting a number of items greater than configured amount
                var selectionCount = decision.getAffectedCount();
                if (selectionCount >= this.certificationConfig.bulkCertifySelectionCountForConfirmation) {
                    requireCountConfirmation = true;
                    dialog = Ext.getCmp('bulkSelectionCountConfirmationDialog');
                    if (!dialog) {
                        dialog = new SailPoint.certification.BulkSelectionCountConfirmationDialog({id: 'bulkSelectionCountConfirmationDialog', selectionCount: selectionCount});
                    } else {
                        dialog.setSelectionCount(selectionCount);
                    }
                }
            }

            if (decision.hasDependantDecisions() &&
                    !decision.isDialogComplete('DependantDecisionConfirmationDialog')){
                return SailPoint.certification.DependantDecisionConfirmationDialog.getInstance();
            }
        }

        if ("Reassign" !== decision.status
                && "Delegated" !== decision.status
                && !(requireCountConfirmation === true || decision.isDialogComplete('BulkSelectionCountConfirmationDialog'))
                && this.certificationConfig.requireBulkCertifyConfirmation
                && !decision.isDialogComplete('BulkCertificationConfirmationDialog') 
                && decision.isBulk()){
            return SailPoint.certification.BulkCertificationConfirmationDialog.getInstance();
        }

        if (decision.isBulk() && ("Remediated" === decision.status || "RevokeAccount" === decision.status)
                     && !decision.isDialogComplete('BulkSelectionCountConfirmationDialog')) {
            //If bulk revoking, show confirmation if affecting a number of items greater than configured amount
            var selectionCount = decision.getAffectedCount();
            if (selectionCount >= this.certificationConfig.bulkCertifySelectionCountForConfirmation) {
                return SailPoint.certification.BulkSelectionCountConfirmationDialog.getInstance(selectionCount);
            }
        }

        // Next, determine if we need to display a dialog for the main action
        if (!decision.isUndo()){
            if ("Mitigated" === decision.status && !decision.isDialogComplete('MitigationDialog')){
                // Only show mitigation dialog if they have it explicityly enabled, otherwise just use the default
                // mitigation date.
                var commentsRequired = this.decisionRequiresComments(decision.status);
                var allowExpirationDateEdit = this.certificationConfig.mitigationDialogEnabled;

                if (!decision.editMitigation && !allowExpirationDateEdit && !commentsRequired) {
                    decision.mitigationExpirationDate = this.certificationConfig.defaultMitigationExpiration;
                } else {
                    return SailPoint.MitigationDialog.getInstance(allowExpirationDateEdit, commentsRequired);
                }
            }

            if (("Remediated" === decision.status || "RevokeAccount" === decision.status) &&
                    decision.assignedRole && !decision.isDialogComplete('AssignedRoleRemediationDialog')){
                return SailPoint.certification.AssignedRoleRemediationDialog.getInstance();
            }

            if ("Remediated" === decision.status && !decision.isDialogComplete('RemediationDialog') &&
                    !decision.isDialogComplete('ViolationRemediationDialog')){

                // For violations we always show a dialog
                if (decision.isPolicyViolation())
                    return SailPoint.certification.ViolationRemediationDialog.getInstance();

                var showRemediationDialog = true;
                var isBulkDecision = decision.isBulk();
                var secondPassInfo =  !decision.isEntityDecision() && !isBulkDecision ?
                        SailPoint.Certification.CertificationItemSecondPass.getInfo(decision.id) : null;

                // only show the dialog if the second pass said so, or if it's read only. We show it on
                // read only items so users can view the details of items that have already been decided
                // If default revoker is set, we don't want to show remediation dialog even for bulk decision
                if (decision.readOnly === true) {
                    showRemediationDialog = true;
                } else if (secondPassInfo) {
                    showRemediationDialog = secondPassInfo.showRemediationDialog;
                } else if (isBulkDecision && !this.certificationConfig.showRemediationDialog && this.certificationConfig.defaultRevoker){
                	showRemediationDialog = false;
                }

                if (showRemediationDialog){
                    return SailPoint.RemediationDialog.getInstance();
                }
            }

            if ("RevokeAccount" === decision.status && !decision.isDialogComplete('RemediationDialog')){
                if (this.certificationConfig.showRemediationDialog){
                    var showRevokeAcctDialog = true;
                    var secondPassInfo =  !decision.isEntityDecision() && !decision.isBulk() ?
                            SailPoint.Certification.CertificationItemSecondPass.getInfo(decision.id) : null;

                    if (secondPassInfo){
                        showRevokeAcctDialog = secondPassInfo.showRevokeAccountDialog && "RevokeAccount" === decision.status;
                    }

                    if (showRevokeAcctDialog){
                         return SailPoint.RemediationDialog.getInstance();
                    }
                }
            }

            // todo Need to make SailPoint.CertificationConfig consistently named in both worksheet and detail view
            var hasDefaultAccountReassignee = this.certificationConfig.defaultAccountReassignAssignee != "" && this.certificationConfig.defaultAccountReassignAssignee != null;
            if ((("AccountReassign" === decision.status && !hasDefaultAccountReassignee) || "Reassign" === decision.status || "Delegated" === decision.status) && !decision.isDialogComplete('DelegationDialog')){
                return SailPoint.certification.DelegationDialog.getInstance();
            }

            if (!decision.requiresDelegationReview && "Approved" === decision.status &&
                    decision.missingRequiredRoles && !decision.isDialogComplete('MissingRolesDialog')){
                // delegation review is handled by the standard delegation review dialog since
                // this decision may be just a simple approval.
                var commentsRequired = this.decisionRequiresComments(decision.status);
                return SailPoint.certification.MissingRequiredRolesDialog.getInstance(commentsRequired);
            }

            if (decision.isEntityClassification() && !decision.isDialogComplete('EntityClassificationDialog')){
                return SailPoint.certification.EntityClassificationDialog.getInstance();
            }

            // check to see if we require comments for any of the actions
            if (!decision.isDialogComplete('CommentsDialog') && !decision.isDialogComplete('MissingRolesDialog')
                    && !decision.isDialogComplete('MitigationDialog') &&
                    this.decisionRequiresComments(decision.status)){
                return SailPoint.certification.CommentsDialog.getInstance();
            }

            if (decision.requiresDelegationReview && !dialog && !decision.isDialogComplete('DelegationReviewDialog')){
                return SailPoint.certification.DelegationReviewDialog.getInstance();
            }
        }


        return null;
    },

    /**
     * Check for an existing decision revoking an account level action on
     * this item.
     *
     * @param decision
     */
    hasExistingAccountOperation : function(decision){
        var found = false;
        var accountKeys = decision.oldDecision.getAccountKeys();
        this.decisionStore.each(function(storedDecision, idx, len){
            if (accountKeys.indexOf(storedDecision.revertAccountOp) > -1){
                found = true;
            }
        });
        return found;
    },

    decisionRequiresComments : function(status){

        if (status == 'ApproveAccount'){
            status = 'Approved';
        }

        return this.certificationConfig.actionsRequiringComments.indexOf(status) > -1;
    },

    /**
     * Get a filter string for a particular ID and scope (item or entity)
     * @param entityId Id of the entity
     * @param scope the target of the filter, either CertificaitonItem or CertificationEntity
     */
    getBulkEntityFilter : function(entityId, scope) {
        var prop = (scope && scope === SailPoint.Decision.SCOPE_ITEM) ? "parent.id" : "id";
        // use parent.id since we are selecting all the items for the entity
        return Ext.String.format(prop + "==\"{0}\"", entityId);
    },

    /**
    *  Sends custom field data back to the server.
     */
    saveCustom: function(decision){

        this.fireEvent('beforeSave');
        this.gridIds.each(function(gridId){
            var grid = Ext.getCmp(gridId);
            grid.mask();
        });

        var decisions = [];

        // sending the entire decision is a little verbose since
        // not all object properties are interesting on the backend.
        // this trims the decision down to just what the server needs.
        var itemMsg = {
            entityDecision : decision.entityDecision,
            status: decision.status,
            workItemId: decision.workItemId,
            selectionCriteria: decision.selectionCriteria,
            custom: decision.custom,
            custom1: decision.custom1,
            custom2: decision.custom2,
            overwriteCustomFields : decision.overwriteCustomFields
        };

        decisions.push(itemMsg);

        this.persist(decisions, true);
    },

    /**
     *
     * @param decisions Array of objects to send to the server.
     * @param isCustom True if this is a custom decision type, such
     * as entity classification. The only customer we *might* have
     * using this is JPMC so it will be very rarely used. These decsision
     * types are not stored in the decisionStore, so when the request completes
     * we will not flush the store.
     */
    persist: function(decisions, isCustom){

        this.fireEvent('beforeSave');
        this.gridIds.each(function(gridId){
            var grid = Ext.getCmp(gridId);
            grid.mask();
        });

        var url = '/rest/certification/'+this.certificationConfig.certificationId+'/decisions';
        if (this.certificationConfig.workItemId)
            url += "?workItemId=" + this.certificationConfig.workItemId;

        Ext.Ajax.request({
            scope:{decider:this, isCustom:isCustom},
            url: SailPoint.getRelativeUrl(url),
            params: {decisions: Ext.JSON.encode(decisions)},
            method:'POST',
			timeout: 60*30*1000,
			
            success: function(response){
                try{
                    var response = Ext.decode(response.responseText);

                    if (response.success){
                        var respObj = response.object;

                        var hasWarnings = respObj.warnings && respObj.warnings.length > 0;
                        var hasErrors = respObj.errors && respObj.errors.length > 0;
                        var msgsPanel = Ext.getCmp('messagesPanel');
                        if (hasWarnings || hasErrors){
                            var html = ' <ul id="messagesContent" class="noList">';

                            if (hasErrors){
                                for(var i=0;i<respObj.errors.length;i++){
                                    html += Ext.String.format('<li class="formError">{0}</li>', respObj.errors[i]);
                                }
                            }

                            if (hasWarnings){
                                for(var i=0;i<respObj.warnings.length;i++){
                                    html += Ext.String.format('<li class="formWarn">{0}</li>', respObj.warnings[i]);
                                }
                            }

                            html +=  '</ul>';

                            msgsPanel.update(html);
                            msgsPanel.show();
                        } else {
                            msgsPanel.hide();
                        }

                        if (!this.isCustom){
                            this.decider.fireEvent('save', respObj);
                            this.decider.flush();
                            this.decider.fireEvent("statusChange", this.decider.getEffectiveDecisionCount());

                            if (respObj.invalidItems && respObj.invalidItems.length > 0){
                                 this.decider.fireEvent('invalidItems', respObj.invalidItems);
                            }

                            this.decider.certificationConfig.activeDelegations = respObj.activeDelegations;

                            if (SailPoint.VirtualRadioButton.getInstance())
                                SailPoint.VirtualRadioButton.getInstance().reset();
                        } else {
                             this.decider.fireEvent('decisionProcessed');
                        }

                        this.decider.gridIds.each(function(gridId){
                            var grid = Ext.getCmp(gridId);
                            grid.unmask();

                            var options = {
                                  callback: function() {
                                      var start = (this.getStore().currentPage - 1) * this.getStore().pageSize;
                                      var limit = this.getStore().totalCount;
                                      if (start > 0 && start >= limit) {
                                          // If after decisions are made and the current page
                                          // is beyond the total number of pages, reset
                                          this.getPagingToolbar().moveFirst();
                                      }
                                  },
                                  scope: grid
                            };
                            grid.getStore().load(options);
                        });

                        this.decider.updateStatusWidget(respObj);

                    } else if (response.retry) {
                    	this.decider.retry(decisions, isCustom);
                    } else if (response.errors && response.errors.length && response.errors.length > 0){
                        SailPoint.EXCEPTION_ALERT(response.errors[0]);
                    }
                } catch(err){
                   SailPoint.FATAL_ERR_JAVASCRIPT(err, "Could not save decisions.");
                }

                var shouldGoBack = false;
                if (respObj.readyForSignoff == true && this.decider.certificationConfig.backForSignoff== true){
                    shouldGoBack = true;
                }

                this.decider.fireEvent('afterSave', shouldGoBack);
            },
            /**
            * Throws up a sys err msg. Note that this is not called when
            * success==false in the response, but if the call returns a 404 or 500.
            */
            failure: function(response){
                this.decider.gridIds.each(function(gridId){
                    var grid = Ext.getCmp(gridId);
                    grid.unmask();
                });
                this.decider.fireEvent('afterSave');
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
    }
});

// ----------------------------------------------------------------------
//
// STATIC METHODS
//
// ----------------------------------------------------------------------

SailPoint.Decider.init = function(config){
    SailPoint.Decider._instance = new SailPoint.Decider(config);
    return SailPoint.Decider._instance;
};

SailPoint.Decider.getInstance = function(){
    if (!SailPoint.Decider._instance){
        SailPoint.Decider.init();
    }
    return SailPoint.Decider._instance;
};

// ----------------------------------------------------------------------
//
// CLASSIFICATION METHODS
//
// ----------------------------------------------------------------------


SailPoint.entityClassification = function(){
    var dataObj = SailPoint.getCustomEntityValues();
    if (!dataObj)
        return;

    Ext.get('mainPanel').mask("#{msgs.processing_spinner}");

    var recordId = SailPoint.CurrentEntityDetails.entityId;

    var url = '/rest/certEntity/'+recordId+'/classification';
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl(url),
        params: {data: Ext.JSON.encode(dataObj)},
        method:'POST',
        success: function(response){

            try{
                Ext.get('mainPanel').unmask();
                var response = Ext.decode(response.responseText);

                if (response.success){
                    //alert('done');
                } else if (response.errors && response.errors.length && response.errors.length > 0){
                    SailPoint.EXCEPTION_ALERT(response.errors[0]);
                }
            } catch(err){
               SailPoint.FATAL_ERR_JAVASCRIPT(err, "Could not save item classification data.");
            }
        },
        failure: function(response){
            Ext.get('mainPanel').unmask();
            SailPoint.FATAL_ERR_ALERT.call(this);
        }
    });
};

/**
 * Updates item classification data using ajax request.
 *
 * @param dataObj Date to send to the server. Expects up to 3 keys,
 *   custom1(String), custom2(String) and customMap(Object).
 * @param recordId CertificationItem ID
 */
SailPoint.itemClassification = function(dataObj, recordId){

    Ext.get('mainPanel').mask("#{msgs.processing_spinner}");

    var url = '/rest/certification/item/'+recordId+'/itemClassification';
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl(url),
        params: {data: Ext.JSON.encode(dataObj)},
        method:'POST',
        success: function(response){

            try{
                Ext.get('mainPanel').unmask();
                var response = Ext.decode(response.responseText);

                if (response.success){
                    //alert('done');
                } else if (response.errors && response.errors.length && response.errors.length > 0){
                    SailPoint.EXCEPTION_ALERT(response.errors[0]);
                }
            } catch(err){
               SailPoint.FATAL_ERR_JAVASCRIPT(err, "Could not save item classification data.");
            }
        },
        failure: function(response){
            Ext.get('mainPanel').unmask();
            SailPoint.FATAL_ERR_ALERT.call(this);
        }
    });
};

/*
* Helper function used to simplify item classification updates.
* */
SailPoint.updateItemCustom1 = function(newValue, recordId){
    SailPoint.itemClassification({custom1:newValue}, recordId);
};

SailPoint.updateItemCustom2 = function(newValue, recordId){
    SailPoint.itemClassification({custom2:newValue}, recordId);
};

SailPoint.updateCustomMap = function(newValue, recordId){
    SailPoint.itemClassification({customMap:newValue}, recordId);
};


