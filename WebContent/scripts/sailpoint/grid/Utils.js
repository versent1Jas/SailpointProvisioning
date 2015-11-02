/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Collection of utilities for ExtJS-based grids
 */
Ext.define('SailPoint.grid.Util', {
    statics : {
        /** 
         * Renders boolean data as checkboxes or blank cells.  This method is intended to be used
         * as a renderer in a grid column.
         */
        renderBoolean: function(value, metadata, record, rowIndex, colIndex, store) {
            return SailPoint.grid.Util.renderBooleanImpl(value, metadata, 'true');
        },

        /**
         * Renders boolean data as a check icon or blank cell. This renderer will render the icon
         * for the negated value of the boolean.
         */
        renderBooleanNot: function(value, metadata, record, rowIndex, colIndex, store) {
            return SailPoint.grid.Util.renderBooleanImpl(value, metadata, 'false');
        },

        /**
         * Returns the value passed to it
         * @param value the value to render
         * @returns {*} the rendered value
         */
        renderRawValue: function(value) {
            return value
        },
        /**
         * Implementation of rendering a boolean grid column value as an icon.
         */
        renderBooleanImpl: function(value, metadata, trueString) {
            var renderedHTML,
                boolValue, isTrue;

            if (value && typeof(value) == "string") {
          		if (value.toString().toLowerCase() === trueString) {
          			isTrue = true;
          		} else {
          			isTrue = false;
          		}
            } else {
            	boolValue = new Boolean(value);
            	if (boolValue.toString().toLowerCase() === trueString) {
            		isTrue = true;
            	} else {
            		isTrue = false;
            	}
            }
            // Render a checkbox in cells whose string value is equal to trueString
            if (isTrue) {
                renderedHTML = '<img src="' + SailPoint.getRelativeUrl('/images/icons/accept.png') + '"/>';
            } else {
                renderedHTML = '&nbsp;'
            }

            // Fix the cell's metadata so that the icon is centered
            metadata.style = 'text-align:center';

            return renderedHTML;
        },
        
        /**
         * Renders HTML formatted description text.  This method is intended to be used
         * as a renderer in a grid column.
         */
        renderDescription: function(value, metadata, record, rowIndex, colIndex, store) {
            var str = '<div style="white-space:normal !important;">{0}</div>';
            return Ext.String.format(str, ( value == null ? '' : value));
        },
        
        /**
         * Renders the text in our 'fakeLink' style.  This method is a renderer for a grid column
         */
        renderFakeLink: function(value, metadata, record, rowIndex, colIndex, store) {
            metadata.tdCls="fakeLink";
            return value;
        },
        
        /**
         * Renders a JSON-based set of icons.  Each record's IIQ_accountIcons field contains something like this:
         * [{ title: 'Icon Tooltip', icon: 'icon/image/url' }, { ... }, ...]  
         */
        renderAccountWithIcons: function(value, metadata, record, rowIndex, colIndex, store) {
            var iconsHtml = '';
            var iconObjs = record.get('IIQ_accountIcons');
            var iconObj;
            var i;
            
            if (iconObjs) {
                iconsHtml = '<div style="float:right; margin-left: 10px;">';
                for (i = 0; i < iconObjs.length; ++i) {
                    iconObj = iconObjs[i];
                    iconsHtml += "<img title='"+SailPoint.sanitizeHtml(iconObj.title)+"' src='"+ SailPoint.getRelativeUrl(iconObj.icon) +"' class='inlineGridIcon'/>";
                }
            }

            iconsHtml += "</div>";
            
            // Fall back on the account's native identity if its name is null
            if (value == null) {
                value = record.get('nativeIdentity');
            }
            
            // Note: the shenanigans with the EventManager prevent the link from interfering with the expando's functionality 
            return '<div style="width: 98%;">' + iconsHtml + '<a class="disclosure account" onclick="Ext.fly(Ext.EventManager.getTarget(event)).parent(\'div\', true).click();">' + value + '</a></div>';
        },
        
        renderStatusWithIcon: function(value, metadata, record, rowIndex, colIndex, store) {
            var statusStyleClass = record.get('IIQ_status_class');
            var iconHtml = '<div style="float:left" class="' + statusStyleClass + ' inlineGridIcon"></div>';
            var html = '<div style="width: 98%;">' + iconHtml + '<span>' + value + '</span></div>';
            return html;
        },
        
        renderESigMeaning: function(obj, meta, record) {

            var meaning;
            
            if(!obj) {
                obj = {};
            }
            
            if(SailPoint.CURR_USER_LOCALE && SailPoint.CURR_USER_LOCALE != "") {
                meaning = obj[SailPoint.CURR_USER_LOCALE];
            }
            
            if(meaning == null) {
                // SYSTEM_LOCALE is either the system default, the first allowed, or the JVM locale (in that order).
                meaning = obj[SailPoint.SYSTEM_LOCALE];
            }
            
            if(meaning == null) {
                meaning == "";
            }
            
            return meaning;
        },
        
        wordWrapRenderer: function(value, metaData, record, row, col, store, gridView) {
            metaData.style='white-space: pre-line !important; word-wrap: break-word !important;'
            return value;
        },
        
        renderScore: function(value, p, record) {
        	  str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
        	  return Ext.String.format(str, value.color, value.score);
        	}
    }
});