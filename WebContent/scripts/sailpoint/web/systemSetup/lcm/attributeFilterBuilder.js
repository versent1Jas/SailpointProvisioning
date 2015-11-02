
Ext.define('SailPoint.systemSetup.lcm.AttributeFilterSuggest', {
	extend : 'SailPoint.IdentityAttributeSuggest',
	
    constructor: function(config) {
        this.filterBuilder = config.filterBuilder;
        this.callParent(arguments);
    }
});

Ext.define('SailPoint.systemSetup.lcm.AttributeSuggestPlugin', {
	extend : 'Ext.util.Observable',
	
	attributeSuggest : null,
	
    constructor: function(config) {
        this.attributeSuggest = Ext.create('SailPoint.systemSetup.lcm.AttributeFilterSuggest', {
            emptyText: '#{msgs.selector_add_identity_attribute}',
            filterBuilder: config.filterBuilder
        });
        this.callParent(arguments);
    },
    
    init: function(toolbar) {
        this.toolbar = toolbar;
        toolbar.on('render', this.onRender, this);
    },
    
    onRender: function() {
        this.toolbar.add(this.attributeSuggest);
        this.attributeSuggest.on('select', function(suggest, records, index) {
            suggest.filterBuilder.addAttribute({name: records[0].data.name, displayName: records[0].data.displayName});
            suggest.setValue('');
        });
        
        this.attributeSuggest.getStore().getProxy().extraParams.userOnly = 'true';
    }
});

Ext.define('SailPoint.systemSetup.lcm.AttributeFilterBuilder', {
	extend : 'Ext.panel.Panel',
	
    /**
     * Input that will contain the JSON string that gets passed to and from the server 
     */
    filterBinding: null,    
    errorPanel: null,
    
    constructor: function(config) {
        this.filterBinding = config.filterBinding;
        this.errorPanel = config.errorPanel;
        this.callParent(arguments);
    },
    
    initComponent: function() {
        var builderPanel = this;
        var attributeSuggestPlugin = Ext.create('SailPoint.systemSetup.lcm.AttributeSuggestPlugin', {
            filterBuilder: this
        });
        this.attributeSuggest = attributeSuggestPlugin.attributeSuggest;
        this.tbar = new Ext.Toolbar({plugins: attributeSuggestPlugin});
        this.bbar = new Ext.Toolbar({
            items:[{
                text: '#{msgs.group_selected}',
                handler: function(button, e) {
                    builderPanel.groupSelected(); 
                } 
            },{
                text: '#{msgs.ungroup_selected}',
                handler: function(button, e) {
                    builderPanel.ungroupSelected();
                }
            },{
                text: '#{msgs.selector_delete_selected}',
                handler: function(button, e) {
                    builderPanel.deleteSelected();
                }
            }]
        });
        
        this.html = '<div id="' + this.id + 'FilterBuilderBody"/>';
        
        this.attributeCoder = Ext.create('SailPoint.systemSetup.lcm.AttributeCoder', {
            encodeTo: this.id + 'FilterBuilderBody'
        });
        
        this.callParent(arguments);
    },
    
    afterRender: function() {
        var filterBindingDom;
        var filterString;
        var filterObj;
        
        this.callParent(arguments);
        
        filterBindingDom = Ext.get(this.filterBinding).dom;
        filterString = filterBindingDom.value;
        if (filterString.length > 0) {
            filterObj = Ext.JSON.decode(filterString);
        }
        
        if (!filterObj) {
            filterObj = {};
        };
        
        this.attributeCoder.encode(filterObj);
    },
    
    getFilterObj: function(withSelections) {
        if (!withSelections) {
            var withSelections = false;
        }
        
        return this.attributeCoder.decode(Ext.get(this.id + 'FilterBuilderBody'), {}, withSelections);
    },
    
    /**
     * Adds the specified attribute to the top level of the filter.
     * @param attributeInfo The attribute info is an object with two properties: 
     * name has the attribute's name and displayName has the attribute's display name
     */
    addAttribute: function(attributeInfo) {
        var name = attributeInfo.name;
        var displayName = attributeInfo.displayName;
        var filterObj = this.getFilterObj();
        var children;
        
        if (filterObj.leafAttribute) {
            // If this is a leaf we need to group it with the new one
            children = [filterObj, {
                leafAttribute: true,
                grouping: false,
                selectable: true,
                name: name,
                displayName: displayName
            }];
            
            filterObj = {
                leafAttribute: false,
                grouping: true,
                selectable: false,
                operation: 'or',
                children: children
            };
        } else if (filterObj.grouping) {
            // Merge the current top-level filterObj with the new attribute
            filterObj.children.push({
                leafAttribute: true,
                grouping: false,
                selectable: true,
                name: name,
                displayName: displayName
            });            
        } else {
            // If filter is empty populate it
            filterObj = {
                leafAttribute: true,
                grouping: false,
                selectable: true,
                name: name,
                displayName: displayName
            };
            
        }

        this.attributeCoder.encode(filterObj);
        this.doLayout();
    },
    
    groupSelected: function() {
        var i;
        var filterObj = this.getFilterObj(true);
        var groupableChildren;
        var childrenToGroup = [];
        var newGroup;
        var updatedChildren = [];
        
        if (this.validateGroupable(filterObj)) {
            // Figure out what we're grouping
            groupableChildren = filterObj.children;
            for (i = 0; i < groupableChildren.length; ++i) {
                if (groupableChildren[i].selected) {
                    childrenToGroup.push(groupableChildren[i]);
                    groupableChildren[i].selected = false;
                    groupableChildren[i].selectable = false;
                } else {
                    updatedChildren.push(groupableChildren[i]);
                }
            }
            
            newGroup = {
                operation: 'or',
                grouping: true,
                leafAttribute: false,
                selectable: true,
                children: childrenToGroup
            };
            
            updatedChildren.push(newGroup);
            
            filterObj.children = updatedChildren;
            
            this.attributeCoder.encode(filterObj);
        }
        
        this.updateErrors();
        this.doLayout();
    },
    
    ungroupSelected: function() {
        var i;
        var j;
        var filterObj = this.getFilterObj(true);
        var children;
        var ungroupedChildren;
        var updatedChildren = [];

        if (this.validateUngroupable(filterObj)) {
            // Figure out what we're ungrouping
            children = filterObj.children;
            for (i = 0; i < children.length; ++i) {
                if (children[i].selected) {
                    ungroupedChildren = children[i].children;
                    for (j = 0; j < ungroupedChildren.length; ++j) {
                        updatedChildren.push(ungroupedChildren[j]);                        
                    }
                } else {
                    updatedChildren.push(children[i]);
                }
            }
                        
            filterObj.children = updatedChildren;
            
            this.attributeCoder.encode(filterObj);
        }
        
        this.updateErrors();
        this.doLayout();
    },
    
    deleteSelected: function() {
        var i;
        var filterObj = this.getFilterObj(true);
        var children;
        var ungroupedChildren;
        var updatedChildren = [];

        if (this.validateDeletable(filterObj)) {
            if (!filterObj.children) {
                filterObj = {};
            } else {
                // Decide what to keep
                children = filterObj.children;
                for (i = 0; i < children.length; ++i) {
                    if (!children[i].selected) {
                        updatedChildren.push(children[i]);
                    }
                }
                
                // Restructure the items we're keeping as needed
                if (updatedChildren.length == 0) {
                    filterObj = {};
                } else if (updatedChildren.length == 1) {
                    filterObj = updatedChildren[0];
                } else {
                    filterObj.children = updatedChildren;
                }
            }
            
            this.attributeCoder.encode(filterObj);
        }
        
        this.updateErrors();
        this.doLayout();
    },

    save: function() {
        $(this.filterBinding).value = Ext.JSON.encode(this.getFilterObj(false));
    },
    
    /**
     * Validate that neither selection contains more than one level of composite filters
     */
    validateGroupable: function(filterObj) {
        var numSelections = 0;
        var errors = [];
        var filterObj = this.getFilterObj(true);
        var selectableAttributes = filterObj.children;
        var i;
        
        // Conditions to validate:
        if (selectableAttributes) {
            for (i = 0; i < selectableAttributes.length; ++i) {
                if (selectableAttributes[i].selected) {
                    numSelections++;
                }
            }

            // More than two attributes must exist at the top level
            if (numSelections == 0) {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');                
            } else if (numSelections < 2) {
                errors.push('#{msgs.lcm_request_controls_select_two_or_more}');
            }

            // If all attributes are selected then they are already grouped
            if (selectableAttributes.length == numSelections) {
                errors.push('#{msgs.lcm_request_controls_already_grouped}');
            }        
        } else {
            // Can't group a single attribute
            if (filterObj.selected) {
                errors.push('#{msgs.lcm_request_controls_select_two_or_more}');
            } else {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');
            }
        }

        if (errors.length > 0) {
            errors.splice(0, 0, '#{msgs.lcm_request_controls_not_groupable}');
        }

        this.errors = errors;
        
        return errors.length === 0;
    },

    /**
     * Validate that neither selection contains more than one level of composite filters
     */
    validateUngroupable: function(filterObj) {
        // Conditions to validate:
        // At least one attribute must be selected
        // Selected attribute(s) must be a group
        var numSelections = 0;
        var errors = [];
        var filterObj = this.getFilterObj(true);
        var selectableAttributes = filterObj.children;
        var i;
        var isNotGrouped = false;
        
        // Conditions to validate:
        if (selectableAttributes) {
            // At least one attribute must be selected
            for (i = 0; i < selectableAttributes.length; ++i) {
                if (selectableAttributes[i].selected) {
                    numSelections++;
                    if (!selectableAttributes[i].grouping) {
                        isNotGrouped = true;
                    }
                }
            }
            
            if (isNotGrouped) {
                errors.push('#{msgs.lcm_request_controls_selection_not_grouped}');
            }
            
            if (numSelections == 0) {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');                
            }
        } else {
            if (filterObj.selected) {
                errors.push('#{msgs.lcm_request_controls_selection_not_grouped}');
            } else {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');
            }
        }

        if (errors.length > 0) {
            errors.splice(0, 0, '#{msgs.lcm_request_controls_not_ungroupable}');
        }

        this.errors = errors;
        
        return errors.length === 0;
    },

    /**
    * Validate that neither selection contains more than one level of composite filters
    */
   validateDeletable: function(filterObj) {
       // Conditions to validate:
       // At least one attribute must be selected
        var numSelections = 0;
        var errors = [];
        var filterObj = this.getFilterObj(true);
        var selectableAttributes = filterObj.children;
        var i;
        
        // Conditions to validate:
        if (selectableAttributes) {
            // At least one attribute must be selected
            for (i = 0; i < selectableAttributes.length; ++i) {
                if (selectableAttributes[i].selected) {
                    numSelections++;
                }
            }
            
            if (numSelections == 0) {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');                
            }
        } else {
            if (!filterObj.selected) {
                errors.push('#{msgs.lcm_request_controls_nothing_selected}');
            }
        }

        if (errors.length > 0) {
            errors.splice(0, 0, '#{msgs.lcm_request_controls_not_deletable}');
        }

        this.errors = errors;
        
        return errors.length === 0;
   },
   
   updateErrors: function() {
       var errorObj;
       var errorDivs;
       var i;
       
       if (this.errors.length == 0) {
           errorObj = {};
       } else {
           errorDivs = [];
           for (i = 0; i < this.errors.length; ++i) {
               errorDivs.push({
                   tag: 'div',
                   html: this.errors[i]
               });
           }

           errorObj = {
               tag: 'div', 
               cls: 'formError',
               children: errorDivs
           };
       }
       
       Ext.DomHelper.overwrite(this.errorPanel, errorObj);
   },
   
   /**
    * Returns an arrat error messages if there are problems with this filter
    */
   validate: function() {
      var filter = this.getFilterObj();
      var errors = [];
      
      if (!filter.grouping && !filter.leafAttribute) {
          errors.push('#{msgs.lcm_config_attribute_filter_needs_content}');
      }
      
      return errors;
   }
});

Ext.define('SailPoint.systemSetup.lcm.AttributeCoder', {
	extend : 'Ext.Component',
	
    /**
     * The div into which the attributes should be decoded.  This is required and this 
     * component will not work if it's not supplied
     */
    encodeTo: null,

    encoderTopLevelTpl: new Ext.XTemplate(
        '<table class="spTable">',
          '<tpl if="leafAttribute">',
            '<tr><th style="padding:5px">#{msgs.label_attribute}</th></tr>',
            '<tr>',
              '<td>',
                '<span style="padding:3px"><input type="checkbox"/></span>',
                '<span class="name" style="display:none">{name}</span><span class="displayName">{displayName}</span>',
              '</td>',
            '</tr>',
          '</tpl>',
          '<tpl if="grouping">',
            '<tr><th style="padding:5px">#{msgs.label_operation}</th><th style="padding:5px">#{msgs.label_attribute}</th></tr>',
            '<tr>',
              '<td style="padding-left:5px; width:50px">',
                '<select>',
                  '<tpl if="this.isOr(operation)">',
                    '<option value="and">#{msgs.filter_and}</option>',
                    '<option value="or" selected="true">#{msgs.filter_or}</option>',
                  '</tpl>',
                  '<tpl if="this.isOr(operation) == false">',
                    '<option value="and" selected="true">#{msgs.filter_and}</option>',
                    '<option value="or">#{msgs.filter_or}</option>',
                  '</tpl>',              
                '</select>',
              '</td>',
              '<td style="padding-left:5px">',
                '<div class="width100">',
                  '<table class="attributesTable width100" style="border:none">',
                    '<tpl for="children">',
                      '<tr>',
                        '<tpl if="leafAttribute">',
                          '<td style="width:25px">',
                            '<span style="padding:3px"><input type="checkbox"/></span>',
                          '</td>',
                          '<td style="padding:5px">',
                            '<span class="name" style="display:none">{name}</span><span class="displayName">{displayName}</span>',
                          '</td>',
                        '</tpl>',
                        '<tpl if="grouping">',
                          '<td style="width:25px">',
                            '<span style="padding:3px"><input type="checkbox"/></span>',
                          '</td>',
                          '<td style="padding:5px"><div class="grouping"><div class="groupingContents"></div></div></td>',
                        '</tpl>',
                      '</tr>',
                    '</tpl>',
                  '</table>',
                '</div>',
              '</td>',
            '</tr>',
          '</tpl>',
        '</table>',  
        {
            isOr: function(operation) {
                return operation == 'or';
            }
        }
    ),
    
    encoderSubLevelTpl: new Ext.XTemplate(
      '<table class="spTable width100">',
        '<tr><th style="padding:5px">#{msgs.label_operation}</th><th style="padding:5px">#{msgs.label_attribute}</th></tr>',
        '<tr>',
          '<td style="padding-left:5px; width:50px">',
            '<select>',
              '<tpl if="this.isOr(operation)">',
                '<option value="and">#{msgs.filter_and}</option>',
                '<option value="or" selected="true">#{msgs.filter_or}</option>',
              '</tpl>',
              '<tpl if="this.isOr(operation) == false">',
                '<option value="and" selected="true">#{msgs.filter_and}</option>',
                '<option value="or">#{msgs.filter_or}</option>',
              '</tpl>',              
            '</select>',
          '</td>',
          '<td style="padding-left:5px">',
            '<div class="width100">',
              '<table class="attributesTable width100" style="border:none">',
                '<tpl for="children">',
                  '<tr>',
                    '<tpl if="leafAttribute">',
                      '<td style="padding:5px">',
                        '<span class="name" style="display:none">{name}</span><span class="displayName">{displayName}</span>',
                      '</td>',
                    '</tpl>',
                    '<tpl if="grouping">',
                      '<td style="padding:5px"><div class="grouping"><div class="groupingContents"></div></div></td>',
                    '</tpl>',
                  '</tr>',
                '</tpl>',
              '</table>',
            '</div>',
           '</td>',
          '</tr>',
        '</table>', 
      {
          isOr: function(operation) {
              return operation == 'or';
          }
      }
    ),

    constructor: function(config) {
         this.encodeTo = config.encodeTo;     
         this.callParent(arguments);
    },
    
    initComponent: function() {
        if (!this.encodeTo) {
            // This should never happen in production because it indicates a programming 
            // error that should have been corrected before the code was even checked in.
            // This just saves the programmer the trouble of stepping through firebug and/or
            // digging through the console.
            Ext.MessageBox.alert('Coding Error', 'An AttributeEncoder with id ' + config.id + ' was created without an encodeTo.  Please specify one.');
        }
        this.callParent(arguments);
    },
    
    /**
     * Takes an object with the structure specified here and renders a snazzy attribute editing table for it.  Here's a representative 
     * sample structure:
     * {
     *   operation: 'or'
     *   grouping: true,
     *   leafAttribute: false,
     *   selectable: false,
     *   children: [{ 
     *     grouping: false, 
     *     leafAttribute: true,
     *     selectable: true,
     *     name: 'Department',
     *     displayName: 'Department'
     *   },{ 
     *     operation: 'and',
     *     grouping: true, 
     *     leafAttribute: false,
     *     selectable: true,
     *     children: [{
     *       grouping: false,
     *       leafAttribute: true,
     *       selectable: false,
     *       name: 'Cost Center'
     *       displayName: 'Cost Center'
     *     }, {
     *       grouping: false,
     *       leafAttribute: true,
     *       selectable: false,
     *       name: 'Location'
     *       displayName: 'Location'
     *     }]
     *   }]
     * }
     */
    encode: function(objToEncode, whereToEncode, isSubLevel) {
        var controlsPanel = Ext.getCmp('requestControlsPanel');
        var groupings;
        var whereToEncodeGrouping;
        var groupingIdx = 0;
        var childIdx;
        var potentialGrouping;
        var encoderTpl = isSubLevel ? this.encoderSubLevelTpl : this.encoderTopLevelTpl;
        
        if (!whereToEncode) {
            whereToEncode = this.encodeTo;
        }
        
        if (objToEncode.operation || objToEncode.leafAttribute) {
            encoderTpl.overwrite(whereToEncode, objToEncode);
            // Now look for sub-groupings and handle them
            groupings = Ext.DomQuery.select('div[class=groupingContents]', whereToEncode);
            if (groupings && groupings.length > 0) {
                for (childIdx = 0; childIdx < objToEncode.children.length; ++childIdx) {
                    potentialGrouping = objToEncode.children[childIdx];
                    if (potentialGrouping.grouping) {
                        whereToEncodeGrouping = Ext.get(groupings[groupingIdx]).parent().dom;
                        this.encode(potentialGrouping, whereToEncodeGrouping, true);
                        groupingIdx++;
                    }
                }
            }
        } else {
            Ext.get(whereToEncode).update('<div class="formWarn">#{msgs.lcm_request_controls_no_attributes_specified}</div>');
        }
        
        if (!isSubLevel) {
            // controlsPanel.fireEvent('resize', controlsPanel);
        }
    },
    
    /**
     * Takes an encoded table of attributes and decodes it into an attribute info object.  See the encode() method
     * for an example of the attribute info object
     */
    decode: function(nodeToDecode, decodedNode, withSelections) {
        // Check for empty
        if (!decodedNode) {
            var decodedNode = {};
        }
        
        var table = Ext.DomQuery.selectNode('table', Ext.get(nodeToDecode).dom);
        var numCols;
        var nameSpan;
        var displayNameSpan;
        var operationSelect;
        var selectedOperation;
        var attributesTable;
        var attributeRow;
        var attributeGrouping;
        var decodedAttributes;
        var attributeNode;
        var containerNode;
        var checkboxNode;
        var isSelected;
        var i;
        
        if (table) {
            numCols = table.tBodies[0].rows[0].cells.length;
            
            if (numCols === 1) {
                // If the table only has a single column then this is a non-grouped node consisting of one attribute.
                decodedNode.grouping = false;
                decodedNode.leafAttribute = true;
                checkboxNode = Ext.DomQuery.selectNode('input[type=checkbox]', table.rows[1]);
                if (checkboxNode) {
                    decodedNode.selectable = true;
                } else {
                    decodedNode.selectable = false;
                }
                
                nameSpan = Ext.DomQuery.selectNode('span[class=name]', table.rows[1]);
                displayNameSpan = Ext.DomQuery.selectNode('span[class=displayName]', table.rows[1]);
                if (withSelections) {
                    if (checkboxNode) {
                        isSelected = checkboxNode.checked;
                    } else {
                        isSelected = false;
                    }
                    decodedNode.selected = isSelected;
                }
                
                decodedNode.name = nameSpan.innerHTML;
                decodedNode.displayName = displayNameSpan.innerHTML;     
            } else {
                // Otherwise this is a grouped node
                decodedNode.grouping = true;
                decodedNode.leafAttribute = false;
                containerNode = Ext.get(table).findParent('tr');
                checkboxNode = Ext.DomQuery.selectNode('input[type=checkbox]', containerNode);
                if (checkboxNode) {
                    decodedNode.selectable = true;
                } else {
                    decodedNode.selectable = false;
                }
                
                // The first column is the grouping's operation
                operationSelect = Ext.DomQuery.selectNode('select', table.rows[1].cells[0]);
                selectedOperation = operationSelect.options[operationSelect.selectedIndex];
                decodedNode.operation = selectedOperation.value;
                if (withSelections) {
                    if (checkboxNode) {
                        isSelected = checkboxNode.checked;
                    } else {
                        isSelected = false;
                    }
                    decodedNode.selected = isSelected;
                }
                
                // The second column is a div containing a table of attributes and/or groupings
                // We handle the attributes here and recursively handle the groupings
                attributesTable = Ext.DomQuery.selectNode('table[class*=attributesTable]', table.rows[1].cells[1]);
                
                decodedAttributes = [];

                for (i = 0; i < attributesTable.rows.length; ++i) {
                    attributeRow = attributesTable.rows[i];
                    attributeGrouping = Ext.DomQuery.selectNode('div[class=grouping]', attributeRow);
                    if (attributeGrouping) {
                        // Recursively decode this group
                        attributeNode = {};
                        this.decode(attributeGrouping, attributeNode, withSelections);
                    } else {
                        nameSpan = Ext.DomQuery.selectNode('span[class=name]', attributeRow);
                        displayNameSpan = Ext.DomQuery.selectNode('span[class=displayName]', attributeRow);
                        checkboxNode = Ext.DomQuery.selectNode('input[type=checkbox]', attributeRow);
                        if (withSelections) {
                            if (checkboxNode) {
                                isSelected = checkboxNode.checked;
                            } else {
                                isSelected = false;
                            }
                        }

                        attributeNode = {
                            grouping: false,
                            leafAttribute: true,
                            selectable: checkboxNode ? true : false,
                            selected: isSelected,
                            name: nameSpan.innerHTML,
                            displayName: displayNameSpan.innerHTML
                        };
                    }
                    
                    decodedAttributes.push(attributeNode);
                    decodedNode.children = decodedAttributes;
                }
            }
        } 
        
        return decodedNode;
    }
});
