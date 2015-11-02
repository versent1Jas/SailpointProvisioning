/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

//Semaphore for locking elements so that an effect is not applied to them twice.
var toggleLock = false;

/** Trim function **/
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
}

/*
 * Browser tabs need a unique id to differentiate session data.
 * 8 random characters should be more than enough.
 */
function generateTabId() {
    return 'xxxxxxxx'.replace(/[x]/g, function(c) {
        var r = Math.random() * 16|0;
        return r.toString(16);
    });
}

/** Declar indexOf **/
if(!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(needle) {
      for(var i = 0; i < this.length; i++) {
          if(this[i] === needle) {
              return i;
          }
      }
      return -1;
  };
}

/*
 * Some pages need to track which tab is doing what in the session (i.e. reports).
 * This will set the window.name attribute (which is persisted across refreshes 
 * and navigation) and the editForm:tabId value that is set on the bean.
 * (So far only TaskDefinitionBean and TaskResultsBean)
 */
function setBrowserTabId() {
    if($("editForm:tabId") != null){
        if(window.name == "") {
            if($("editForm:tabId").value != ""){ // this probably shouldn't happen
                window.name = $("editForm:tabId").value;
            }
            else {
                window.name = generateTabId();
                $("editForm:tabId").value = window.name;
            }
        }
        // Either a blank value, or we're on a different tab than we should be.
        else if ($("editForm:tabId").value != window.name) {
            $("editForm:tabId").value = window.name;
        }
    }
}

/**
 * A prototype window observer that - after the window is displayed - will look
 * for any divs containing javascript and evaluate them.  This is required since
 * prototype window populates the window using innerHTML, which does not execute
 * any javascript in the innerHTML on IE.  To use this, instead of putting your
 * javascript in script tags in windows, include it in divs with the
 * 'ieJavascriptFixDiv' class.
 */
var ieJavascriptFixingObserver = {
    name: 'ieJavascriptFixingObserver',
    onShow: function() {
        SailPoint.Log.message("Looking for ie javascript divs.");
        var jsDivs = $A(Ext.DomQuery.select('div[class=ieJavascriptFixDiv]'));
        jsDivs.each(function(jsDiv) {
            SailPoint.Log.message("Found: " + jsDiv.innerHTML);
            eval(jsDiv.innerHTML);
        });
    }
};

function encode(string) {
  return escape(string).replace('+', '%2B').replace('%20', '+').replace('*', '%2A').replace('/', '%2F').replace('@', '%40');
}

function randomUUID(len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 
  uuid = [], rnd = Math.random;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (var i = 0; i < len; i++) uuid[i] = chars[0 | rnd()*radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (var i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | rnd()*16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
      }
    }
  }

  return uuid.join('');
}


/*
 * Function for toggling the display of an element using scriptaculous effects.
 * An example of this would be to use a checkbox to blind-up/down a div (called the
 * targetElement here).  Utilizes the toggleLock to prevent the effect from being
 * applied twice at the same time.
 * Uses the scriptaculous Blind Up/Down effect.
 */
function flipImage(onImage, offImage, imageElement, targetElement) {
    if(targetElement) {
        if(targetElement.visible())
            imageElement.src = CONTEXT_PATH + offImage;
        else
            imageElement.src = CONTEXT_PATH + onImage;
    }
}

/**
 * Show or hide all elements in the given array.
 */ 
function _showOrHide(eltArray, showElements) {
    eltArray.each(
        function (elt) {
            if (null === elt) {
                return;
            }

            if (showElements) {
                elt.show();
            }
            else {
                elt.hide();
            }
        }.bind(this));
}

function showHideWithLock(targetElement, sourceElement, speed, afterFinishCallback) {

    var timeout;
    
    // If the effect is not already occurring, lock the element using the toggleLock
    if (!toggleLock && targetElement) {
        
        if (null != speed) {
            timeout = speed + 100; // set the timeout slightly more than the speed.
        } 
        else {
            timeout = 350;
            speed = 250;
        }
        
        toggleLock = true;

        var element;
        var isArray = false;
        var endIndex = 1;
        // Handle arrays as well
        if (targetElement.length > 0) {
            endIndex = targetElement.length;
            element = Ext.get(targetElement[0]);
            isArray = true;
        } 
        else {
            element = Ext.get(targetElement);
        }
        
        var i = 0;
        while (i < endIndex) {
            
            element.setVisibilityMode(Ext.dom.AbstractElement.DISPLAY);
            element.toggle({
                duration: speed,
                listeners: {
                    // listen for lastframe event because the callback config
                    // option doesn't seem to be working.
                    lastframe : {
                        fn: function(){
                            // Sometimes we need to call more than one function in the callback,
                            // pass in an object containing the functions and chain them together with some args.
                            // e.g. {fn1:primaryFunction, fn2:secondaryFunction, args:{...}}
                            if(afterFinishCallback && Ext.isObject(afterFinishCallback)){
                                var callback = Ext.Function.createSequence(afterFinishCallback.fn1, afterFinishCallback.fn2);
                                callback(afterFinishCallback.args);
                                toggleLock = false;
                            }
                            else if(afterFinishCallback){
                                afterFinishCallback(this);
                            }
                        }
                    },
                    scope: element
                }
            });

            Ext.defer(function(){
                toggleLock = false;
            }, timeout);
            
            i++;
            if (isArray) {
                element = Ext.get(targetElement[i]);
            }
        }
    } 
    else {
        if (sourceElement != null)
            sourceElement.checked = !sourceElement.checked;
    }
}

/*
 * Function for controlling the display of an element. The displayOnValue
 * parameter provides a hint as to the value that, when selected, will cause the
 * targetElement to be displayed. Note that no lock is required on this one
 * because the current value of the radio itself implicitly determines whether
 * the effect should be applied or not
 */
function showHideForRadio(targetElement, sourceElement, displayOnValue) {
    var showThisElement = (sourceElement.value == displayOnValue);

    var element;
    var isArray = false;
    //Handle arrays as well
    if(targetElement.length > 0) {
        var endIndex = targetElement.length;
        element = targetElement[0];
        isArray = true;
    } else {
        var endIndex = 1;
        element = targetElement;
    }

    var i=0;
    while(i < endIndex) {
        if(showThisElement && !element.visible()) {
            element.style.display='';
            // BlindDown and BlindUp can't keep up with radio buttons
            // Effect.BlindDown(element);
            setTimeout('toggleLock=false',1000);
        } else if(!showThisElement && element.visible()){
            element.style.display='none';
            // BlindDown and BlindUp can't keep up with radio buttons
            // Effect.BlindUp(element);
            setTimeout('toggleLock=false', 1000);
        }
        i++;
        if(isArray) {
            element = targetElement[i];
        }
    }
}

function resizeTables(contentElId) {
    if(Ext.isIE7) {
        if (!contentElId) {
            contentElId = 'spBackground';
        }
        
        var tables = Ext.DomQuery.select('table[class*=width100]', $(contentElId));
        if (tables != null) {
            for(var i=0; i<tables.length; i++) {
                tables[i].width='95%';
                tables[i].style.width='95%';
                break; // only resize the top level table.
            }
        }
    }
}

// Makes a table multicolored such that all displayed even rows are one color
// and all displayed odd rows are another.  Uses livegrid colors style if none specified.
function makeTableMulticolored(tableElement, skipHeader, skipFooter, oddClass, evenClass,
                               skipClass, numHeaderRows, numFooterRows, groupSize) {
    
    if(!tableElement)
        return;

    if (typeof numHeaderRows == 'undefined') {
        var numHeaderRows = 1;
    }
    if (typeof numFooterRows == 'undefined') {
        var numFooterRows = 1;
    }
    if (typeof groupSize == 'undefined') {
        var groupSize = 1;
    }

    var tableRows = tableElement.rows;
    var startIndex = (skipHeader ? numHeaderRows : 0);
    var endIndex = tableRows.length - (skipFooter ? numFooterRows : 0);
    var visibleRow = 1;
    var groupNum = 1;

    for (var i = startIndex; i < endIndex; ++i) {
        if(skipClass && tableRows[i].className == skipClass) {
             continue;
         }

        // Figure out which group the row is in.  For example, if groupSize is 3
        // rows 1-3 are in group 1, rows 4-6 are in group 2.  The minus one and
        // plus one are needed here due to the non-zero based indexes.
        groupNum = Math.floor((visibleRow-1) / groupSize) + 1;
        
        if (groupNum % 2 == 0) {
            tableRows[i].className = (evenClass) ? evenClass : 'ricoLG_evenRow';
        }  else {
            tableRows[i].className = (oddClass) ? oddClass : 'ricoLG_oddRow';
        }

        if (tableRows[i].style.display != 'none') {
          ++visibleRow;
        }
    }
}

function getInputDateValue(id) {
  var day = $(id+".day").value;
  var month = $(id+".month").value - 1;
  var year = $(id+".year").value;
  
  return new Date(year, month, day);
}

// Disables or enables the tomahawk inputDate fields.
function toggleInputDate(element, condition) {
    var parentElement = Ext.getDom(element);
    var childInputs = parentElement.getElementsByTagName('INPUT');
    var childSelects = parentElement.getElementsByTagName('SELECT');
    for(i = 0; i < childInputs.length; i++) {
        childInputs[i].disabled = condition;
    }
    for(j = 0; j < childSelects.length; j++) {
        childSelects[j].disabled = condition;
    }
}

/** This function will show/hide a date field in the reports configuration pages.  
 * It also will reset the date when not shown to prevent validation errors.
 */
function toggleDateDisplay(element, condition) {
  toggleDisplay(element, condition);

  if(condition) {
    var span = Ext.DomQuery.select('span', element);
    
    var valid = Validator.validateInputDate(span[0].id);
    if(!valid) {
      var date = new Date();
      var childInputs = Ext.DomQuery.select('input', element);
      var childSelects = Ext.DomQuery.select('select', element);
      for(i = 0; i < childInputs.length; i++)
      {
        if(childInputs[i].id.indexOf("day") > 0) {
          childInputs[i].value = date.getDate();
        }
        if(childInputs[i].id.indexOf("year") > 0) {
          childInputs[i].value = date.getFullYear();
        }
      }
      for(i = 0; i < childSelects.length; i++)
      {
        if(childSelects[i].id.indexOf("month") > 0) {
          childSelects[i].value = date.getMonth()+1;
        }
      }
    }
  }
}

function toggleDisplay(element, condition) {
  if(element) {
      if(!condition) {
          element.style.display = '';
      } else {
          element.style.display = 'none';
      }
  }
}

function toggleDisabled(element, condition) {
  element.disabled = condition;
}

function enableInputDate(element) {
    var parentElement = $(element);
    var childInputs = parentElement.getElementsByTagName('INPUT');
    var childSelects = parentElement.getElementsByTagName('SELECT');
    for(i = 0; i < childInputs.length; i++) {
        childInputs[i].disabled = false;
    }
    for(j = 0; j < childSelects.length; j++) {
        childSelects[j].disabled = false;
    }
}

/**
 * Enable or disable a multi-select component.  This will attempt to do the
 * right thing regardless of whether we have a standard multi-select or a
 * multi-suggest component.
 * 
 * @param  selectName   The name of the select component if using non-suggest
 *                      (eg - editForm:myList).
 * @param  suggestName  The name of the multi-suggest component if using a
 *                      multi-suggest (eg - editForm:mySuggestList).
 * @param  disabled     Whether the component should be enabled or disabled.
 */
function enableMultiSelect(selectName, suggestName, disabled) {
    
    var selectElt = $(selectName);
    var suggestElt = $(suggestName);
    var selectBox = $(suggestName + '.selectBox');
    var addBtn = $(suggestName + '.addButton');
    var deleteBtn = $(suggestName + '.deleteButton');

    if (null != selectElt) {
        selectElt.disabled = disabled;
    }
    else if (null != suggestElt) {
        suggestElt.disabled = disabled;
        selectBox.disabled = disabled;
        addBtn.disabled = disabled;
        deleteBtn.disabled = disabled;
    }
    else {
        throw 'Could not find multiselect or suggest elements to disable.';
    }
}

function hashToMapString(hash) {

    var mapString = "{";
    var sep = "";
    if(hash.each) {
      hash.each(function(pair, idx) {
                  mapString += sep + pair.key + "=" + pair.value;
                 sep = ",";
              }.bind(this));
    }

    mapString += "}";

    return mapString;
}

function arrayToMapString(myArray) {

    var mapString = "{";
    var sep = "";
    for(var key in myArray) {
      /**Ignore extensions **/
      if(key!="extend") {
        mapString+= sep + key + "=" + myArray[key];
        sep = ", ";
      }
    }
    mapString += "}";

    return mapString;
}

function arrayToString(myArray, includeBrackets, noSpaces) {
    var s = '';

    if (null != myArray) {
      if(typeof myArray == 'string') {
        s = myArray;
      } else {
        var sep = '';
        for (var i=0; i<myArray.length; i++) {
            s += sep + myArray[i];
            if(noSpaces) {
                sep = ',';
            } else {
                sep = ', ';                
            }
        }
      }
    }
    
    if (includeBrackets) {
        s = '[' + s + ']';
    }

    return s;
}

function stringToArray(myString, includeBrackets) {
    if (myString==null)
        return new Array();

    var str=myString;

    if (includeBrackets) {
        str = myString.substring(1, myString.length-1)
    }

    return str.split(', ');
}

//This function will count the number of checked boxes in the
//given container as long as they are identified with the
//checkboxIds string. Once the count is calculated, the count
//is appended to the displayPanel div that is supplied as the third
//parameter.
function countSelected(container, checkboxIds, displayPanel)
{
    var count = 0;
    if(null != container)
    {
        var checks = container.getElementsByTagName('input');
        var checkboxes = $A(checks);
        for(var i=0; i<checkboxes.length; i++)
        {
            //   if (checkboxIds != null) <-- That doesn't work in javascript.
            // If the variable is not explicitly set to null it is undefined.  
            // Instead we have to do:
            //   if (checkboxIds)
            // This returns false if checkboxIds is falsy.  The values null and undefined are 
            // both falsy and any object (including an array) is truthy so this will behave 
            // the way we want it to. --Bernie
            if(checkboxIds) {
                if(checkboxes[i].checked && checkboxes[i].id == checkboxIds)
                    count += 1;
            } else {
                if(checkboxes[i].checked)
                    count +=1;
            }
        }
        // if (null != displayPanel) <-- Doesn't work.  See comments above.
        if(displayPanel)
        {
            var tpl = new Ext.Template("#{msgs.count_identities_selected}");
            displayPanel.innerHTML = "<span class='buttonStyle'>" + tpl.apply([count]) + " </span>";
            Effect.Appear(displayPanel);
        }
    }
    return count;
}

// Toggle all of the checkboxs in the given container element that have the
// given checkboxId to match whether the given selectAllCheckbox is checked or
// not.
//
// container:          The container element in which the checkboxes to toggle
//                     can be found.
// selectAllCheckbox:  The "select all" checkbox whose checked state is to be
//                     replicated in all other checkboxes.
// checkboxIds:        The ID of the checkboxes to toggle.
function toggleSelectAll(container, selectAllCheckbox, checkboxIds)
{
    var isChecked = selectAllCheckbox.checked;
    var checks = container.getElementsByTagName('input');
    var checkboxes = $A(checks);
    for (var i=0; i<checkboxes.length; i++)
    {
        if (checkboxes[i].id == checkboxIds)
            checkboxes[i].checked = isChecked;
    }
}

/**
 * JSF creates IDs for elements that have the parent container paths as a prefix
 * to the component ID (eg - 'editForm:_091:myId').  This can make it difficult
 * (if not impossible) to load some elements by ID.  This function will search
 * the document for all elements with the given style class and return an array
 * of elements whose ID end with the given ID suffix.
 *
 * @param  className  The name of the style class of the elements to search for.
 * @param  idSuffix   The ID suffix of the elements to search for.
 *
 * @return An array of elements with the given style class and idSuffix.
 */
function getElementsByClassAndSuffix(className, idSuffix) {

    var eltByClassArray = document.getElementsByClassName(className);
    return eltByClassArray.findAll(
        function(elt) {
            return elt.id.endsWith(idSuffix);
        });
}

// JSF doesn't use button groups.  This makes it difficult to get the selected
// value from a radio input.  This function facilitates that.  Just give it the
// input's id (along with the form name as a prefix).  It returns the value of
// the input that is currently selected.
//
// Sample Usage: var selectedInput = getSelectedRadioInput('myForm:radioComponentId');
function getSelectedRadioInput(inputID) {
    var radioInputs = $(document.getElementsByName(inputID));

    var selectedInput;

    for (i = 0; i < radioInputs.length && !selectedInput; ++i) {
        var inputElement = radioInputs.item(i);

        if (inputElement.checked) {
            selectedInput = inputElement.value;
        }
    }

    return selectedInput;
}

// This function accepts two strings and returns true if the
// given string ends with the given substring
function endsWith(string, substring) {
    var lastIndex = string.lastIndexOf(substring);

    return (lastIndex + substring.length == string.length);
}

// This function accepts two strings and returns true if the
// given string begins with the given substring
function beginsWith(string, substring) {
    return string.indexOf(substring) == 0;
}

// This function returns true if the given string is a numeric value
// and false otherwise
function isNumber(potentialNumber) {
    if (potentialNumber <= 0 || potentialNumber > 0) {
        return true;
    } else {
        return false;
    }
}

// Confirmation Dialog for a save button.  This functionality depends on the window.js file
// isPageDirty is a flag whose value is true when the page on which the
//      button was pressed is dirty and false otherwise
// actionButtonId is the id of the button that will perform the actual
//      save action.  The action button is not necessarily visible to the user.
function confirmSave(isPageDirty, actionButtonId) {
    confirmSaveCancel("#{msgs.confirm_save_title}", "#{msgs.confirm_save_msg}", isPageDirty, actionButtonId);
}

// Confirmation Dialog for a cancel button.  This functionality depends on the window.js file
// isPageDirty is a flag whose value is true when the page on which the
//      button was pressed is dirty and false otherwise
// actionButtonId is the id of the button that will perform the actual
//      cancel action.  The action button is not necessarily visible to the user.
function confirmCancel(isPageDirty, actionButtonId) {
    confirmSaveCancel("#{msgs.confirm_cancel_title}", "#{msgs.confirm_cancel_msg}", isPageDirty, actionButtonId);
}

function confirmSaveCancel(title, msg, isPageDirty, actionButtonId) {
    if (isPageDirty && (isPageDirty === true || isPageDirty === 'true')) {
        Ext.MessageBox.confirm(title, msg, function (button) {
            if (button == 'yes') {
                return Ext.getDom(actionButtonId).click();
            }
        });
    } else {
        return Ext.getDom(actionButtonId).click();
    }
}

/** Function used to build tooltips dynamically based on whether
images with "imgHlp" are located on the page.  Uses the image's
alt text to build the tooltip**/

function buildTooltips(node) {
    Ext.tip.QuickTipManager.init();

    var images = Ext.DomQuery.select('img[id*=imgHlp]', node);
    
    for(var i = 0; i<images.length; i++) {
        Ext.tip.QuickTipManager.register({
            target : images[i].id,
            title : '',
            text : images[i].alt || Ext.fly(images[i]).getAttribute('ttip'),
            dismissDelay : 10000 // Hide after 10 seconds hover
        });
        
        /** Move the alt text to 'ttip' so ie doesn't try to do its own tooltip **/
        if(images[i].alt !== "") {
            Ext.fly(images[i]).set({ttip:images[i].alt, alt:''});
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
//
// A VirtualRadioButton is used to maintain state of ImageRadios between
// LiveGrid scrolls.  LiveGrid manipulates the DOM when the content is scrolled
// and can remove rows with form inputs.  To retain this state, create a
// VirtualRadioButton and add onclick handlers to the ImageRadio divs that
// call VirtualRadioButton.selectRadio().  The updateRadios() method should be
// called after a LiveGrid refresh request is completed to make sure that the
// inputs on the page are in sync with the state of the VirtualRadioButton.
//
////////////////////////////////////////////////////////////////////////////////

Ext.ns('SailPoint');
SailPoint.VirtualRadioButton = Class.create();

SailPoint.VirtualRadioButton.prototype = {

    /**
     * The ID of the element containing all radios.
     */
    containerId: null,

    /**
     * The prefix of the radio button names (eg - if the radios are named
     * myRadio123738734, this would be 'myRadio').  This allows returning the
     * values mapped from ID to value.
     */
    radioNamePrefix: null,

    /**
     * All values of the radio buttons mapped by radio name -> value.
     */
    radioValues: null,

    /**
     * The values of the radio buttons that have changed since they were
     * rendered.  This is similar to radioValues, but only holds values that
     * have changed due to user interaction - not radios that are initialized
     * as selected.
     */
    changedValues: null,

    /**
     * Constructor.
     */
    initialize: function(containerId, radioNamePrefix) {
        this.containerId = containerId;
        this.radioNamePrefix = radioNamePrefix;
        this.radioValues = new Hash();
        this.changedValues = new Hash();
        SailPoint.VirtualRadioButton._instance = this;
    },

    /**
     * Reset the values that have been marked as selected on this virtual radio.
     */
    reset: function() {
        this.radioValues = new Hash();
        this.changedValues = new Hash();
    },

    /**
     * Handler that should be called to alert the VirtualRadioButton that the
     * given radio button has been selected by the user.
     */
    radioSelected: function(divOrRadio) {

        var radio = ImageRadio.getRadio(divOrRadio);

        // TODO: this syntax is deprecated in prototype 1.6+.  Use get/set.
        this.radioValues[radio.name] = radio.value;
        this.changedValues[radio.name] = radio.value;
    },

    radioUnselected: function(divOrRadio) {

        var radio = ImageRadio.getRadio(divOrRadio);

        // TODO: this syntax is deprecated in prototype 1.6+.  Use unset.
        delete this.radioValues[radio.name];
        delete this.changedValues[radio.name];
    },

    /**
     * Handler that should be called to alert the VirtualRadioButton that the
     * given radio button has had it's value set by the user.
     */
    radioValueSet: function(divOrRadio, value) {

        var radio = ImageRadio.getRadio(divOrRadio);
        ImageRadio.setRadioValue(radio, value);

        // TODO: this syntax is deprecated in prototype 1.6+.  Use unset.
        delete this.radioValues[radio.name];
        delete this.changedValues[radio.name];

//        if (('' != value) && (null != value)) {
            // TODO: this syntax is deprecated in prototype 1.6+.  Use get/set.
            this.radioValues[radio.name] = value;
            this.changedValues[radio.name] = value;
//        }
    },


    radioValueGet: function(divOrRadio) {
        var radio = ImageRadio.getRadio(divOrRadio);
        if (radio)
            return ImageRadio.getRadioValue(radio);
        return null;
    },

    /**
     * Update the radios in the container to match the state in this
     * VirtualRadioButton.  This also attaches ImageRadio event handlers to the
     * radios.
     */
    updateRadios: function() {
        var radios = this._getRadios();
        radios.each(function(radio, idx) {
                        if ((null != radio.name) && (0 == radio.name.indexOf(this.radioNamePrefix))) {
                            // Initialize as an image radio button.
                            ImageRadio.attachEventsToRadio(radio);

                            // Select if the value is selected.
                            if (this._isSelected(radio)) {
                                ImageRadio.selectRadio(radio);
                            }
                        }
                    }.bind(this));
     },

    /**
     * Get a hash from radio name (or ID if radioNamePrefix was specified) to
     * radio value of the radios that have had their values changed.
     */
    getChangedValues: function() {

        // If there is no prefix, just return the hash.
        if (null == this.radioNamePrefix) {
            return this.changedValues;
        }

        // There is a prefix, so return a hash that has the prefixs stripped.
        var newHash = new Hash();
        this.changedValues.each(function(pair, idx) {
                                    var key = pair.key;
                                    key = this.stripPrefix(key);

                                    // TODO: this syntax is deprecated in prototype 1.6+.  Use get/set.
                                    newHash[key] = pair.value;
                                }.bind(this));
        return newHash;
    },

    stripPrefix: function(radioName) {
        if (radioName && radioName.indexOf(this.radioNamePrefix) == 0) {
            return radioName.substr(this.radioNamePrefix.length);
        } else {
            return radioName;
        }
    },
    
    /**
     * Select the ImageRadio for the given div or radio element.
     */
    _selectRadio: function(divOrRadio) {
        var radio = ImageRadio.getRadio(divOrRadio);

        // TODO: this syntax is deprecated in prototype 1.6+.  Use get/set.
        this.radioValues[radio.name] = radio.value;
    },

    _isSelected: function(radio) {
        // TODO: this syntax is deprecated in prototype 1.6+.  Use get/set.
        return (radio.value == this.radioValues[radio.name]);
    },

    _getRadios: function() {
        var radios = [];
        if(this.containerId && Ext.getDom(this.containerId)) {
            radios = Ext.getDom(this.containerId).getElementsByTagName('input');
        }
        return Ext.Array.toArray(radios);
    }
}

SailPoint.VirtualRadioButton.getInstance = function(){
    return SailPoint.VirtualRadioButton._instance;
}


////////////////////////////////////////////////////////////////////////////////
//
// A VirtualCheckbox is used to maintain state of checkboxes between LiveGrid
// scrolls.  LiveGrid manipulates the DOM when the content is scrolled and
// can remove rows with checkboxes.  To retain this state, create a
// VirtualCheckbox and add onchange handlers to the checkboxes to toggle the
// VirtualCheckbox state.  The updateCheckboxes() methods should be called
// after a LiveGrid refresh request is completed to make sure that the
// checkboxes on the page are in sync with the value of the VirtualCheckbox.
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.VirtualCheckbox = Class.create();

SailPoint.VirtualCheckbox.prototype = {

    // Constructor.
    //
    // containerId: The ID of the DOM element in which all checkboxes will be
    //              loaded.
    // checkboxIds: The IDs of the checkboxes being managed by this virtual
    //              checkbox.
    initialize: function(containerId, checkboxIds, itemDescription, itemPluralDescription) {
        this.containerId = containerId;
        this.checkboxIds = checkboxIds;
        this.checkboxValues = [];
        this.allChecked = false;
        this.count = 0;
        this.itemDescription = itemDescription;
        this.itemPluralDescription = itemPluralDescription;
    },

    // Toggle whether the given checkbox is selected or not, the value and the
    // selected status are pulled from the given checkbox.
    toggle: function(checkboxElement) {
        if (null != checkboxElement) {
            if (checkboxElement.checked) {
                this.count++;
                if(this.checkboxValues.member(checkboxElement.value) && !this.allChecked)
                    this.count--;


               // Prevent duplicates.  May want to remove this if it slows things
               // down too much.  If we choose to remove this, duplicate filtering
               // will need to be added to getSelectedValues() and countSelected().

               // also not adding to the array if allchecked is set to true...we only store
               // unchecked boxes in the array if allchecked is true.
              if (!this.allChecked && !this.checkboxValues.member(checkboxElement.value)) {
                  this.checkboxValues.push(checkboxElement.value);
              }
            }
            else {
              this.count--;
              if(this.allChecked && !this.checkboxValues.member(checkboxElement.value)) {
                  this.checkboxValues.push(checkboxElement.value);
              } else {
                  this.checkboxValues = this.checkboxValues.without(checkboxElement.value);
              }
            }
        }
    },

    // Toggle whether all are selected/cleared based on the given select all
    // checkbox.
    toggleSelectAll: function(selectAllCheckbox) {

        // Only clear all if clear all is selected.
        if (!selectAllCheckbox.checked)
            this.checkboxValues.clear();

        if (null != selectAllCheckbox) {
            var checkArray = this._getCheckboxes();
            checkArray.each(function(checkboxElement, idx) {
                                if (this.checkboxIds == checkboxElement.id) {
                                    checkboxElement.checked = selectAllCheckbox.checked;
                                    this.toggle(checkboxElement);
                                }
                            }.bind(this));
        }
    },

    // Instead of a toggle, this function selects all visible checkboxes.
    selectVisible: function() {
        if(this.allChecked) {
            this.count = 0;
            this.checkboxValues = [];
        }
        
        var checkArray = this._getCheckboxes();
        this.allChecked = false;
        checkArray.each(function(checkboxElement, idx) {
                            if (this.checkboxIds == checkboxElement.id) {
                                checkboxElement.checked = true;
                                this.toggle(checkboxElement);
                            }
                        }.bind(this));
    },

    // Selects all checkboxes in the entire livegrid.
    selectAll: function(count) {
        this.selectVisible();
        this.allChecked = true;
        this.count = count;

        //Erase the stored checkboxes
        this.checkboxValues = [];
    },

    selectNone: function() {
        this.allChecked = false;

        //Erase the stored checkboxes
        this.checkboxValues = [];

        var checkArray = this._getCheckboxes();
        checkArray.each(function(checkboxElement, idx) {
                            checkboxElement.checked = false;
                            this.toggle(checkboxElement);
                        }.bind(this));
        this.count = 0;
    },

    // Return whether the given checkbox should be checked based on the status
    // of the virtual checkbox.
    isSelected: function(checkboxElement) {
        return this.checkboxValues.member(checkboxElement.value);
    },

    // Return an array with the selected values.
    getSelectedValues: function() {
        return this.checkboxValues;
    },

    // Return the number of selected items.
    countSelected: function() {
        return this.checkboxValues.length;
    },

    // This function will iterate over all physical checkboxes in the container
    // with the ID specified in the constructor and set their checked property
    // to true if the virtual checkbox says that the value is selected.
    updateCheckboxes: function() {
        var checkArray = this._getCheckboxes();
        checkArray.each(function(checkboxElement, idx) {
                            //If we haven't chosen select all and this box is in the checkbox array,
                            //mark it as checked.
                            if (!this.allChecked && ((this.checkboxIds == checkboxElement.id) &&
                                this.isSelected(checkboxElement))) {
                                checkboxElement.checked = true;
                            }
                            //If we have chosen select all and this box is not the checkbox array,
                            //mark it as checked.
                            else if (this.allChecked && ((this.checkboxIds == checkboxElement.id) &&
                                !this.isSelected(checkboxElement))) {
                                checkboxElement.checked = true;
                            }
                        }.bind(this));
    },

    // Display a message with the current count in the selectedCountElt.
    //
    // selectedCountElt:  The name of the element in which the selected count
    //                    will be displayed.
    // objType:           The type of object being counted.  This will be put
    //                    into the message (eg - user).
    // divClass:          The class of the div that displays the message.
    // todo il8n
    displaySelectedCount: function(selectedCountElt, divClass) {
        var textElement = $(selectedCountElt);
        if (1 == this.count) {
            textElement.innerHTML =
                '<div class="' + divClass + '">' + this.count + ' ' + this.itemDescription + ' selected</div>';
        }
        else {
            textElement.innerHTML =
                '<div class="' + divClass + '">' + this.count + ' ' + this.itemPluralDescription + ' selected</div>';
        }
        if(!textElement.visible()) {
            textElement.style.display='';
        }
        return this.count;
    },

    // Hides the div which displays the selected count.
    //
    // selectedCountElt:  The name of the element in which the selected count
    //                    will be displayed.
    hideSelectedCount: function(selectedCountElt) {
        var textElement = $(selectedCountElt);
        textElement.innerHTML = '';
        textElement.style.display = 'none';
    },

    // Copies the selected values into the given input element.
    // If some values are checked the input element will contain a CSV enclosed in brackets
    //   Example: [abc, def, ghi]
    // and the function will return true.
    // If all the values are selected the input element will contain the string, 'all'
    // and the function will return true.
    // If no values are selected the function will return false.
    copyToInputElement: function(inputElement) {
        var result;
        if (this.count < 1) {
            result = false;
        } else {
            if(!this.allChecked) {
                inputElement.value = arrayToString(this.getSelectedValues(), true);
                result = true;
            } else {
                inputElement.value = 'all';
                result = true;
            }
        }

        return result;
    },

    /**
    * This functions like copyToInputElement, except that it will copy the values
    * even if 'all' are selected.
    */
    getAllElementValues: function() {

        var checks = [];
        if(this.containerId && Ext.getDom(this.containerId)) {
            checks = Ext.getDom(this.containerId).getElementsByTagName('input');
        }
        var valueArr = [];
        for(i=0;i<checks.length;i++){
            valueArr[i] = checks[i].value;
        }

        return arrayToString(valueArr, true);
    },

    _getCheckboxes: function() {
        var checks = [];
        if(this.containerId && Ext.getDom(this.containerId)) {
            checks = Ext.getDom(this.containerId).getElementsByTagName('input');
        }
        return Ext.Array.toArray(checks);
    }
}


////////////////////////////////////////////////////////////////////////////////
//
// SubmitOnEnter allows registering text fields to submit a form using a given
// button when the enter key is pressed in the field.
//
////////////////////////////////////////////////////////////////////////////////
Ext.define('SailPoint.SubmitOnEnter', {
    
    buttonId : null,
    keyPressCallBack : null,
    buttonFinder : null,
    
    // Constructor.
    //
    // buttonId: The ID of the button to click when enter is pressed in any of
    //           the registered text fields.
    //
    // keyPressCallback : An optional callback that can be called when keypress
    //                    events are fired. When using this option the buttonId 
    //                    value is not used and should be null, since all of 
    //                    the keystrok handling will be handled by the custom
    //                    callback.
    //
    // buttonFinder: A function that can be called to locate the button to
    //               click for a given text field.  This is only used if the
    //               buttonId is null.  The function is passed the text field
    //               as its only parameter.
    // 
    constructor : function(buttonId, keyPressCallback, buttonFinder) {
        this.buttonId = buttonId;
        this.keyPressCallBack = keyPressCallback;
        this.buttonFinder = buttonFinder;
    },

    // Register the given text field to submit the form when enter is pressed.
    registerTextField : function (textId) {
        var callback = this._handleKeyPress;
        if ( this.keyPressCallBack ) {
            callback = this.keyPressCallBack;
        }
        
        Ext.EventManager.addListener(textId, "keypress", callback, this);
    },

    _handleKeyPress : function (e, el, options) {        
        if (Ext.EventObject.RETURN === e.getKey()) {
            // Stop the event from bubbling lest the browser get a little
            // frisky and try to submit AGAIN!
            e.stopEvent();
            
            var button = this._getButton(el);
            button.click();
            
            //added for ie6 to avoid twin enter key issue
            return false;
        }
    },
   
    /**
     * Return the button to click based on either the buttonId or the
     * buttonFinder function.
     */
    _getButton : function(textField) {
        var button = null;

        if (null != this.buttonId) {
            button = $(this.buttonId);
        }
        else if (null != this.buttonFinder) {
            button = this.buttonFinder(textField);
        }

        return button;
    },

   //keeping it here to be reusable
   //this is in case all input text fields have to support submission on Enter
   // text type fields that are generated by suggest components are excluded based on element id *Suggest 
   inputTextFieldsCheck : function(node) {
       var root = node ? node : document;
       var inputTextFields = Ext.DomQuery.select('input', root);
       if ( inputTextFields) {
           for (var i = 0; i <  inputTextFields.length; i++) { 
               inputField =  inputTextFields[i]; 
               if (inputField .getAttribute("type") == 'text') {
                      extInputField = Ext.get(inputField);
                   parentSuggest = extInputField.up('div[id*="Suggest"]');
                   if (parentSuggest == null) {
                       this.registerTextField(inputField);
                   }
               }   
           }
       }
   }
});


////////////////////////////////////////////////////////////////////////////////
//
// A class that will call to a give URL with a set of parameters and determine
// whether the response was true or false.  This expects the given URL to
// return nothing except for the text "true" or "false", or an XML document that
// has an <isTrue> element with either "true" or "false" as the content.
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.TrueFalseAJAXChecker = Class.create();
SailPoint.TrueFalseAJAXChecker.prototype = {

    // The URL and parameters to use for the AJAX request.
    ajaxUrl: null,
    requestParams: null,

    // Whether the AJAX request has been executed yet.
    ajaxRequestExecuted: false,

    // The response returned by the AJAX request.
    responseTrue: false,

    //
    // Constructor.
    //
    // @param  ajaxUrl  The AJAX URL to hit for the true/false response.
    // @param  params   A prototype Hash object with the request parameters.
    //
    initialize: function(ajaxUrl, requestParams) {
        this.ajaxUrl = ajaxUrl;
        this.requestParams = requestParams;
    },

    //
    // Execute the AJAX request (if not yet executed) and return whether the
    // response was true or false.
    //
    isResponseTrue: function() {
        if (!this.ajaxRequestExecuted) {
            // Make the AJAX request.  Note that this is synchronous.
            var ajaxReq = new Ajax.Request(
                this.ajaxUrl,
                {
                    method: 'post',
                    parameters: this.requestParams.toQueryString(),
                    onComplete: this.onCompleteCallback.bind(this),
                    asynchronous: false
                });
        }

        return this.responseTrue;
    },

    // Handle the response with the given XMLHttpRequest.  This will
    // toggle isResponseTrue based on the response.
    onCompleteCallback: function(request) {
        this.ajaxRequestExecuted = true;

        if ((null == request) || (request.status != 200))
            return;

        var isTrueText = null;
        var responseXML = request.responseXML;

        // Try to pull from the <isTrue> element if we get an XML document back.
        // NOTE: IE will return an XML doc even if valid XML is not returned in
        // the request, so we have to look a non-empty doc also.
        if ((null != responseXML) && (responseXML.childNodes.length > 0)) {
            var isTrueElts = responseXML.getElementsByTagName("isTrue");
            if ((null != isTrueElts) && (1 == isTrueElts.length)) {
                isTrueText = isTrueElts[0].childNodes[0].nodeValue;
            }
        }

        if (null == isTrueText) {
            // No XML document, just look for "true" or "false" in the text of
            // the response.
            isTrueText = request.responseText;
        }

        if (null != isTrueText) {
            isTrueText = isTrueText.strip();
            if ("true" == isTrueText) {
                this.responseTrue = true;
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
//
// A class that can manipulate the server-side navigation history.  The save
// and back functions are static since this object has no state.
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.NavigationHistory = {

    /**
     * Tell the server-side navigation history to go home.
     */
    home: function() {
        var btn = this._getNavigationHistoryElement('navigationForm:homeBtn');
        if (null != btn) {
            btn.click();
        }
    },

    /**
     * Tell the server-side navigation history to go back.
     */
    back: function() {
        var btn = this._getNavigationHistoryElement('navigationForm:backBtn');
        if (null != btn) {
            btn.click();
        }
    },

    /**
     * Return a function that can be used as the oncancel handler for windows
     * that need to remove a navigation history item when closed.
     */
    getCancelFunction: function(objectId) {
        return function(win) {
            if (null != objectId) {
                $('navigationForm:objectId').value = objectId;
            }
            SailPoint.NavigationHistory.back();
            win.hide();
            return false;
        };
    },
    
    _getNavigationHistoryElement: function(eltName) {
        var elt = $(eltName);
        if (null == elt) {
            alert("Cannot manipulate navigation history.  Page should have " +
                  "element with id '" + eltName + "'");
        }

        return elt;
    }
}


// This function takes a potentially invalid URL query parameter value and returns
// one with escaped query characters in it
// Example: 'joe & bob' becomes 'joe%20%26%20bob'
function makeEscapedQueryParam(queryParam) {
    var escapedParam = '';

    for (var i = 0; i < queryParam.length; ++i) {
        var currentChar = queryParam.charAt(i);

        if (currentChar == '&') {
            escapedParam += '%26';
        } else if (currentChar == ' ') {
            escapedParam += '%20';
        } else if (currentChar == '+') {
            escapedParam += '%2b';
        } else if (currentChar == '#') {
            escapedParam += '%23';
        } else if (currentChar == '%') {
            escapedParam += '%25';
        } else if (currentChar == '\'') {
            escapedParam += '%27';
        } else if (currentChar == '\"') {
            escapedParam += '%22';
        } else {
            escapedParam += currentChar;
        }
    }

    return escapedParam;
}

/*
 * This function truncates labels contained in the specified array to the
 * specified maxLength if necessary.  It then creates tooltips containing
 * the pre-truncated labels and attaches them to the truncated labels.
 * Parameters:
 * elementLabels - Array of DOM elements containing labels that may need to be truncated.
 *                 Typically the array will contain divs, spans, or cells.  Any element
 *                 whose innerHTML is a single text node will work.
 * maxLength - length at which a label gets truncated
 */
function shortenElementLabels(elementLabels, maxLength) {
    if(!elementLabels)
      return;

    var MAX_LABEL_LENGTH;
    if (maxLength) {
        MAX_LABEL_LENGTH = maxLength;
    } else {
        MAX_LABEL_LENGTH = 35;
    }

    var i;
    var originalNodeText;
    var newNodeText;
    var hiddenFloatie;
    var elementLabelId;

    for (i = 0; i < elementLabels.length; ++i) {
        originalNodeText = elementLabels[i].innerHTML;
        if (originalNodeText.length > MAX_LABEL_LENGTH) {
            // Shorten the text
            newNodeText = originalNodeText.substring(0, MAX_LABEL_LENGTH);
            newNodeText += '...';
            elementLabels[i].innerHTML = newNodeText;

            elementLabelId = elementLabels[i].id;
            if (!elementLabelId) {
                var candidateLabelSuffix = elementLabels[i].value;
                if (!candidateLabelSuffix) {
                  candidateLabelSuffix = i;
                } 
                elementLabels[i].id = 'nodeLabel' + candidateLabelSuffix;
                elementLabelId = elementLabels[i].id;
            }

            // Attach a floatie to it
            hiddenFloatieId = elementLabelId + 'Floatie';
            // Reuse existing floaties in the event that we are using AJAX
            hiddenFloatie = $(hiddenFloatieId);
            // Create floaties as needed
            if (!hiddenFloatie) {
                hiddenFloatie = document.createElement('div');
                hiddenFloatie.innerHTML = originalNodeText;
                hiddenFloatie.setAttribute('class', 'fittedFloatie');
                hiddenFloatie.className = 'fittedFloatie';
                hiddenFloatie.id = elementLabelId + 'Floatie';
                document.body.appendChild(hiddenFloatie);
            }
        }
    }
}

function viewAccountGroup(appName, groupAttr, group, id) {

    var params;
    if (id) {
        if (group) {
            params = {id: id, groupName: group};
        } else {
            params = {id: id};
        }
    } else {
        params = {
            applicationName: appName,
            groupAttribute: groupAttr,
            groupName: group,
            // clears out any object that could be on the session from a previous request,
            // we always want to use the id or triplet identifier in the params of this request
            'editForm:id': null
        };
    }

    var counterStore = SailPoint.Store.createStore({
        url: SailPoint.getRelativeUrl('/define/groups/counterAccountGroupsDataSource.json'),
        extraParams : params,
        root : 'counts',
        fields: ['id',
            "memberCount",
            "inheritedCount",
            "inheritingCount",
            "permissionCount",
            "permissionGridMetaData",
            "displayName"
        ],
        listeners: {
            load : displayAccountGroupPopup
        }
    });
    
    counterStore.load({params:{start:0, limit:20}});
    
    return false;
}

/**
* Flip entitlement display mode, either displaying the entitlement value or
* it's description.
*/
function switchEntitlementDescriptionStyle(showDescriptions){

    Page.showEntitlementDescriptions = showDescriptions;

    var descDivs = Ext.query('.entitlementDescriptions');
    if (descDivs){
        for(var i=0;i<descDivs.length;i++){
            descDivs[i].style.display = showDescriptions ? '' : 'none';
        }
    }
    var valueDivs = Ext.query('.entitlementValues');
    if (valueDivs){
        for(var i=0;i<valueDivs.length;i++){
            valueDivs[i].style.display = !showDescriptions ? '' : 'none';
        }
    }
    
    Page.fireEvent('toggleEntitlementDescriptions');
}

// shows link details on identity or certification pages
 function showLinkDetails(targetId, linkId, certItemId, showNonEntitlementsOnly, sourceLink){

    var containingDiv = $("linkDetails_" + targetId);

    var elemsToShowHide = [containingDiv];

    // in certifications the link panel will be contained by a TR which is also
    // hidden. The TR may wrap several other divs so it may not be in the same visibility state
    // as containgDiv. If they are in the same state, show/hide the TR as well.
    var containingTR = $("linkDetailsTR_" + targetId);
    if (containingTR && (containingTR.visible() === containingDiv.visible())){
        elemsToShowHide.push(containingTR);
    }

    // update the content area
    if (!containingDiv.visible()){
        var div = Ext.get("linkContent_" + targetId);
        if (!div.hasCls('loaded')){
            div.addCls('loaded');
            var url = '/identity/linkDetails.jsf?';
            if (linkId)
                url += '&id=' + linkId;
            if (certItemId)
                url += '&certItem=' + certItemId;
            if (showNonEntitlementsOnly)
                url += '&nonEntitlements=' + showNonEntitlementsOnly;
            if (Page.showEntitlementDescriptions != undefined)
                url += '&showDesc=' + Page.showEntitlementDescriptions;

            div.load({
                url: SailPoint.getRelativeUrl(url), 
                callback : function() {
                    showHideWithLock(elemsToShowHide, null, 100, {fn1:resizeIdentityDetailsContainer, fn2:SailPoint.Utils.toggleDisclosureDiv, args:{link:sourceLink, div:elemsToShowHide}});
                    addDescriptionTooltips();
                }
            });
        } else {
            // if we've already loaded just show it
            showHideWithLock(elemsToShowHide, null, 100, {fn1:resizeIdentityDetailsContainer, fn2:SailPoint.Utils.toggleDisclosureDiv, args:{link:sourceLink, div:elemsToShowHide}});
        }
    } else {
        showHideWithLock(elemsToShowHide, null, 100, {fn1:resizeIdentityDetailsContainer, fn2:SailPoint.Utils.toggleDisclosureDiv, args:{link:sourceLink, div:elemsToShowHide}});
    }
}

function toggleEditLink(targetId) {
    var marker = Ext.select('input.editLinkButtonMarker[id="' + targetId + '"]');

    if (marker == null) {
        return;// marker not found
    }

    // Click on the next sibling element
    var nextSib = marker.elements[0].nextSibling;

    if (nextSib == null) {
        return; // a4j button not found?
    }

    nextSib.click();
}

function addDescriptionTooltips() {
  // Initialize the QuickTips.  Set them up for a decent delay before showing
  // since tooltips that come up too quickly could be annoying.
  Ext.QuickTips.init();
  Ext.apply(Ext.QuickTips.getQuickTip(),
  {
    showDelay: 1000,
    autoDismiss: false,
    dismissDelay: 0,
    trackMouse: false
  });

  
  if(Ext.isIE) {
    var tooltipTask = new Ext.util.DelayedTask( 
        addDescriptionTooltipsFn, this
    );
    tooltipTask.delay(1000);
  } else {
    addDescriptionTooltipsFn();
  }
};

/** Separate function for delay on IE browsers (see directly above) **/
function addDescriptionTooltipsFn(rootNode) {
  var values;
  var current;
  var parent;
  var parts;
  var description;
  var descriptions;
  var id;
  var i;
  
  if (rootNode) {
      values = Ext.DomQuery.select('*.entitlementValues img', rootNode);
  } else {
      values = Ext.DomQuery.select('*.entitlementValues img');
  }

  if (null != values) {
    for (i = 0; i < values.length; i++) {
      current = values[i];
      parent = current.parentNode;
      parts = parent.id.split("_");
      id = parent.id.substring(parts[0].length+1);
      
      if(id) {
        description = $('description_'+id);
      }

      // Relying on IDs is unrealiable
      // Look for the nearest span whose class is 'descriptionText' 
        // as an alternate means of obtaining a description
      if (!description) {
          description = Ext.fly(parent).down('*.descriptionText', true);
      }

      // console.debug(description + " " + id);
      if (description) {
          Ext.QuickTips.register({
            target: Ext.get(current),
            text: description.firstChild.innerHTML
          });
      }

      // clear description so it wont be resued for next node
      description = null;
    }
  }
  
  if (rootNode) {
      descriptions = Ext.DomQuery.select('*.entitlementDescriptions img', rootNode);
  } else {
      descriptions = Ext.DomQuery.select('*.entitlementDescriptions img');
  }
  if (null != descriptions) {
    for (i=0; i<descriptions.length; i++) {
        current = descriptions[i];
        parent = current.parentNode;
        parts = parent.id.split("_");
        id = parent.id.substring(parts[0].length+1);
        if(id) {
            description = $('name_'+id);
        }
      
        // Relying on IDs is unrealiable
        // Look for the nearest span whose class is 'descriptionText' 
        // as an alternate means of obtaining a description
        if (!description) {
            description = Ext.fly(parent).down('*.descriptionText', true);
        }

        //console.debug(description + " " + id);
        if (description) {
          Ext.QuickTips.register({
            target: Ext.get(current),
            text: description.firstChild.innerHTML
          });
        }

        // clear description so it wont be resued for next node
        description = null;
    }
  }
}

function toggleLinkDetails(targetId) {
    // Find marker input element
    var marker = Ext.select('input.displayButtonMarker[id="' + targetId + '"]');

    if (marker == null) {
        return;// marker not found
    }

    // Click on the next sibling element
    var nextSib = marker.elements[0].nextSibling;

    if (nextSib == null) {
        return; // a4j button not found?
    }

    nextSib.click();
}

/**
 * Defer the loading of the datasource until the 
 * panel is expanded.
 */
function panelExpanded(panel, annimate) {
    var store = panel.getStore();
    if ( !store.sploaded ) {
        store.load({params:{start:0, limit:5}});
        // store off a flag so we know not to load again
        store.sploaded = true;
    } 
}

SailPoint.viewManagedAttribute = function (record) {
    // for now pass through to viewAccountGroup
    viewAccountGroup(null, null, null, record.getId());
};

SailPoint.LoadingSpinner = Class.create();
SailPoint.LoadingSpinner.prototype = {    
    initialize: function() {
        this.loadingMessage = null;
    },
    
    // Display the spinner at the div indicated by the whereToDisplay parameter
    display: function(whereToDisplay) {
        if (whereToDisplay) {
            if (this.loadingMessage !== null) {
                this.hide();
            }

            var check = Ext.get(whereToDisplay).hasCls('loadingMessageDiv');
            if (!check){
                //for relative positioniong
                Ext.get(whereToDisplay).addCls('loadingMessageDiv');
            }
    
            this.loadingMessage = document.createElement('div');
            //ricoLG_messageDiv not existing now; name changed to loadingSpinnerMessageDiv
            //moved the rico class contents
            this.loadingMessage.className = 'loadingSpinnerMessageDiv';
            this.loadingMessage.innerHTML = '<img src=\"' + CONTEXT_PATH + '/images/progress.gif\" />';
              
            whereToDisplay.appendChild(this.loadingMessage);
    
            var msgWidth = this.loadingMessage.offsetWidth;
            var msgHeight = this.loadingMessage.offsetHeight;
            var displayDivHeight = whereToDisplay.offsetHeight;
            var displayDivWidth = whereToDisplay.offsetWidth;
            
            this.loadingMessage.style.top = Math.round((displayDivHeight - msgHeight) / 2) + 'px';
            this.loadingMessage.style.left = Math.round((displayDivWidth - msgWidth) / 2) + 'px';
        }
    },
    
    hide: function() {
        if (null != this.loadingMessage) {
            this.loadingMessage.style.display = 'none';
            this.loadingMessage.parentNode.removeChild(this.loadingMessage);
            this.loadingMessage = null;
        }
    }
};

//Clear the selections from the specified multi-select DOM element
SailPoint.clearCheckboxMultiSelections = function(multiSelectDomElement) {
    var selections = Ext.DomQuery.select('input[type=checkbox]', multiSelectDomElement);
    for (i = 0; i < selections.length; ++i) {
        selections[i].checked = false;
    }
};


// Clear the selections from the specified multi-select DOM element
SailPoint.clearMultiSelections = function(multiSelectDomElement) {
    var selections = Ext.DomQuery.select('option', multiSelectDomElement);
    for (i = 0; i < selections.length; ++i) {
        selections[i].selected = false;
    }
};

SailPoint.toggleClass = function(selector, cls, disabled) {
    var els = Ext.select(selector);
    els.each(function(el, c, idx) {
        if (disabled) {
            el.addCls(cls);
        } else {
            el.removeCls(cls);
        }
    });
};

////////////////////////////////////////////////////////////////////////////////
//
// A static class for logging messages in the browser.  To enable, set the
// enabled property to true.  This will complain if a div to write the messages
// to is not found in the page.
//
////////////////////////////////////////////////////////////////////////////////

SailPoint.Log = {

    /**
     * Set to true to enable logging.
     */
    enabled: false,

    /**
     * Write a message to the log (if enabled).
     *
     * @param  msg  The message to write.
     */
    message: function(msg) {
        if (true === this.enabled) {
            var log = this._getLogElement();
            log.innerHTML = new Date().getTime() + ': ' + msg + '\n' + log.innerHTML;
            log.show();
        }
    },

    /**
     * Return the div into which to write log messages.
     */
    _getLogElement: function() {
        var elt = $('SailPointLogDiv');
        if (null == elt) {
            alert("Could not find log div in page.");
        }

        return elt;
    }
};


function resizeIdentityDetailsContainer(element) {
    var p = element.findParent('div[id^=identityDetails] .x-panel-default');
    if(p && p.id) {
        var cmp = Ext.getCmp(p.id);
        if(cmp) {
            cmp.updateLayout();
        }
    }
}

/*
 * Bug 13588 (and others that have run into this as well: 1007 and 4869)
 * If the JSF function isn't defined, stub it out so we don't get js errors.
 */
if (typeof(clearFormHiddenParams) == 'undefined') {
    clearFormHiddenParams = function(){};
}