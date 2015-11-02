/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */
/**
 * Utility class to help with FormPanel and formRenderer
 */
Ext.define('SailPoint.form.Util', {
    statics : {
        
        /**
         * FormRenderer hold's all form metaData in a container, each with a unique id based on the formId
         * @param formId
         */
        getContainer : function(formId, containerName) {
            var c = Ext.get(containerName+':form-ct-' + formId);

            if (!c) {
                SailPoint.EXCEPTION_ALERT("Could not locate form container.");
            }

            return c;
        },
        
        /**
         * Returns one of the hidden jsf-backed form fields used to pass data
         * back to the server.
         *
         * @param field The name of the field
         * @param container The container div Element this form is rendered to.
         */
        getHiddenField : function(field, container){
            var inputs = Ext.query("input[class=form-"+field+"]", container.dom);
            if (!inputs || inputs.length === 0) {
                SailPoint.EXCEPTION_ALERT("Could not locate form inputs.");
            }
            else {
                return inputs[0];
            }

            return false;
        },
        /**
         * Recreate the formPanel with the updated formConfig
         *   Expected properties of the 
         *	 @param config
         *   formId : the id used to generate a unique HTML id which the FormPanel should render to
         *   containerFormName : the name (defaults to 'editForm') with which you are rendering a form to
         *   maskerEnum : 'body' or 'window' will mask on the body element or active window rather than the containerFormName during refresh
         *   formsPerPage: when including multiple forms on page, expecting a number (default : 1)
         *   renderInViewport : true if the content should create a viewPort
         *   renderInDiv : defaults to true. do not use unless you are adding the form to an Ext component
         *   persistEvent: Name of Page event which should cause this form to persist itself
         *                 to it's backing hidden input. For example you could pass in 'beforeSave'
         *                 and execute the following code in your on-click event - "Page.fireEvent('beforeSave')"
         *   afterLayoutEvent : Name of Page event which triggers after the Ext layout has occurred
         *   showPreviousValue: If true the previousValue of any field will be displayed to the right
         *                      of the field on the form
         *   meaning : text of the electronic signature meaning
         *   oAuthId : ??? something to do with authorizing
         *   nAuthId : ??? something to do with authorizing
         *   eSigObjId : id of the object being signedOff
         *   eSigObjType : Type of object being signed (workitem/certification)
         *   wizardPanelTitle : String - title of the center pane when using a wizard form
         */
        updateFormPanel : function (config) {
            // the form to return
            var form;
            var formId = config.formId;
            var containerName = (!Ext.isEmpty(config.containerFormName)) ? config.containerFormName : 'editForm';
            var formsPerPage = (!Ext.isEmpty(config.formsPerPage)) ? config.formsPerPage : 1;
            
            // Clearing the listeners breaks pages with multiple forms because clearing 
            // their persist events prevents them from copying their current field values 
            // into the submitted JSON data.  On the other hand, not clearing them breaks 
            // pages that perform AJAX-based postback because we fail to clean up obsolete
            // refresh events for rerendered forms.  It's like we're stuck in the battle of 
            // wits from The Princess Bride.  We're in the wild west with respect to how pages
            // behave after submitting, so there is no single approach that will work for
            // all pages at this time.  For now we'll force the pages to tell us whether or not they want
            // their listeners cleared prior to initialization.  For the time being this works
            // because pages that perform AJAX-based postback only have one form apiece.
            // If we ever get an AJAXy page with multiple forms we'll have to force pages
            // to use a standard form-controlled submit button so that we can properly 
            // determine where in the page's lifecycle (if at all) listeners should be cleared.
            // Most pages these days are refreshing with AJAX, so default with the majority.
            // Also note that the majority is the behavior for all pages prior to adding this.
            // -- Bernie
            var clearListenersOnInit = (!Ext.isEmpty(config.clearListenersOnInit)) ? config.clearListenersOnInit : true; 
            
            var container = this.getContainer(formId, containerName);

            if(!$(containerName+':form-config-'+formId)) {
                SailPoint.EXCEPTION_ALERT("Could not locate form config.");
                return;
            }
            
            //Need to htmlDecode because innerHTML will get serialized with html entity references
            var formConf = Ext.decode(Ext.String.htmlDecode($(containerName+':form-config-'+formId).innerHTML));
            
            if (Ext.isEmpty(formConf)) {
                // ignore and return quietly as this is the first page load
                return;
            }
            
            // destroy the entire component before we try to re-render
            Ext.destroy(Ext.getCmp(formConf.id));
            
            formConf.containerFormName = containerName;
            formConf.formsPerPage = formsPerPage;
            
            var useViewPort = (config.renderInViewport === true) ? true : false;
            var useRenderTo = (config.renderInDiv === false) ? false : true;
            var persistOnEvent = !Ext.isEmpty(config.persistEvent);
            var afterLayoutEvent = !Ext.isEmpty(config.afterLayoutEvent);
            
            // If no body style is set, remove the body border
            Ext.applyIf(formConf, {bodyStyle:'border-style:none'});
        
            formConf.showPreviousValue = (!Ext.isEmpty(config.showPreviousValue)) ? config.showPreviousValue : false;
            if (afterLayoutEvent) {
                if (!formConf.listeners) {
                    formConf.listeners = {};
                }
                
                formConf.listeners['afterlayout'] = (!Ext.isEmpty(afterLayoutEvent)) ? config.afterLayoutEvent : undefined;
            }
        
            if (!useViewPort && useRenderTo)
                formConf.renderTo = 'form-div-' + config.formId;
        
            formConf.maskerEnum = config.maskerEnum;
            formConf.cls = formConf.cls ? (formConf.cls + " form-object") : "form-object";
            formConf.sigMeaning = config.meaning;
            formConf.oAuthId = config.oAuthId;
            formConf.nAuthId = config.nAuthId;
            formConf.eSigObjId = config.objId;
            formConf.eSigObjType = config.objType;

            form = new SailPoint.form.FormPanel( formConf );
            
            if (useViewPort){
        
               form.region = 'center';
               form.collapsible = false;
        
                var wrapperItems = [];
                wrapperItems.push(form);
        
                if (form.wizard){
        
                    form.setTitle(config.wizardPanelTitle);
        
                    var navHtml = "<strong>#{msgs.form_panel_wizard_sections}:</strong><ol class='wizardStepList'>";
                    var count = 0;
                    form.items.each(function(item){
                        navHtml += "<li><a href='#' onclick='SailPoint.jump("+count+")'>"+item.title+"</a></li>";
                        count++;
                    });
                    navHtml += "</ol>";
                    var nav = {
                        region:'west',
                        margins: '0 0 0 0',
                        width: 250,
                        minSize: 200,
                        maxSize: 300,
                        title:"#{msgs.form_panel_wizard_summary}",
                        html:navHtml
                    };
                    wrapperItems.push(nav);
                }
        
               var viewport = SailPoint.getViewport({
                   bodyContent: {
                       xtype : 'container',
                       layout:'border',
                       defaults: {
                           collapsible: true,
                           split: true,
                           bodyStyle: 'padding:15px'
                       },
                       items: wrapperItems
                   }
               });
        
               viewport.updateLayout();
            }
            
            // See the comments at the top of this method regarding when we want or don't want to clear listeners
            if (clearListenersOnInit) {
                Page.clearListeners();
            }

            if (persistOnEvent) {
                Page.on(config.persistEvent, form.persist, form);
             }
             
             Page.on("refresh", form.refresh, form);
             
             this.unmask(config);
             
             return form;
        },
        
        unmask : function(config) {
            var masker = SailPoint.form.Util.getMasker(config);
            
            if (masker) {
                masker.unmask();
            }
            
        },
        
        /*
         * Depending on how the page is laid out will greatly affect the behavior of the load mask.
         * In this case we are using a progression of elements to determine what mask to use. See the config parameter 
         * for the details. If either of the config parameters are not set, we perform a mask on an element with id 'editForm'.
         * @param config
         *        config.maskerEnum - Either 'body' or 'window'. Uses Ext.getBody() or Ext.WindowManager.getActive() to find the 
         *                            element to mask.  This parameter overrides the containerFormName.
         *        config.containerFormName - Mask on the containerForm rather than the body or window.  For forms that are long 
         *                                   (contain a scroll bar) testing the form revealed that the mask only occurs on the 
         *                                   upper portion of the page (the visible body element portion of the page) rather 
         *                                   than where the focus is near the bottom of the page.
         */
        getMasker : function(config) {
            var masker = null;
            
            if (!Ext.isEmpty(config.maskerEnum)) {
                if (config.maskerEnum === 'body') {
                    masker = Ext.getBody();
                } else if (config.maskerEnum === 'window') {
                    masker = Ext.WindowManager.getActive();
                }
            }
            // default to form element name if maskerEnum is not defined
            if (Ext.isEmpty(masker) && config.containerFormName) {
                masker = Ext.get(config.containerFormName);
            }
            // last resort default to editForm
            if (Ext.isEmpty(masker)) {
                masker = Ext.get('editForm');
            }
            
            return masker;
        },
        
        renderHelpText : function(field) {
            if (field.helpText && field.helpText !== '') {
                var label = field.getEl().down('label');
                if (label) {
                    var contents = label.getHTML();
                    
                    // avoid displaying two image tags when when silly places like workflowPanel try to override Ext.Field behavior
                    if (!label.down('img')) {
                
                        // Add an <img> inside the label so it will float right and align with the column
                        var imgTag = '<img id="hlp-' + field.id + '" src="'
                                + SailPoint.getRelativeUrl('/images/icons/dashboard_help_12.png')
                                + '" class="formHelpIcon helpIcon"/>';
                        var helpImage = label.insertHtml('beforeEnd', imgTag);
        
                        Ext.create("Ext.ToolTip", {
                            target : helpImage,
                            html : field.helpText,
                            dismissDelay : 15000
                        // auto hide after 15 seconds
                        });
                    }

                }
            }
        }
               
    }
});