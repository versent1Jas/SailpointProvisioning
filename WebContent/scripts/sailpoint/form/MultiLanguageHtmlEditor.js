Ext.define('SailPoint.MultiLanguageHtmlEditor', {
    extend: 'SailPoint.HtmlEditor',
    alias : 'widget.multilanghtmleditor',
    
    languages : [],
    
    languageStore : null,
    
    defaultLocale : null,
    
    currentLocale : null,

    langSelectEnabled : true,
    
    languageJSON: null,
    
    forcedDefaultLocale : null,
    
    initComponent:function() {
        
        //Fix the value before calling the parent
        if (this.languageJSON) {
            /** clean out any line breaks on the json **/
            this.languageJSON = this.languageJSON.replace(/\r/g, '').replace(/\n/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
            this.languages = Ext.JSON.decode(this.languageJSON);
    
            //var RecordType = Ext.data.Record.create([{name:'id', type:'string'},{name:'name', type:'string'},{name:'displayName', type:'string'}]);
            if(this.languages.length > 0) {
                /** Loop through the languages and try to set the value to the isCurrent locale.  If it doesn't exist, fall back to the default value.
                 * This way, we always initialize the value to be the value for the user's locale unless it is null **/
                var i, len, language,
                defaultValue, currentValue;
                
                for(i = 0, len = this.languages.length; i < len; i++) {
                    language = this.languages[i];
                  
                    if(language.isDefault || language.locale == null) {
                        if(language.value && language.value != 'null') {
                            defaultValue = language.value;
                        }
                    }
                    else if (language.isCurrent){
                        currentValue = language.value;
                    }
                    else if (language.locale == this.defaultLocale) {
                        //Used in case we are refreshing the page before persisting the localized attributes
                        currentValue = language.value;
                        language.isCurrent = true;
                    }
                }
                
                //Check explicitly for undefined, since null can be an actual value
                if (typeof currentValue !== 'undefined') {
                    this.value = currentValue;
                }
                else if (typeof defaultValue !== 'undefined') {
                    this.value = defaultValue;
                }
            }
        }
        
        // Any HTML formatting stored in the description was escaped
        // when we did the Ext.JSON.decode().  Unescape the values here:
        if (this.value) {
            this.value = Ext.String.htmlDecode(this.value);
        } else {
            this.value = '';
        } 
        
        /** Do language selection **/
    
        this.languageStore = SailPoint.Store.createRestStore({
          autoLoad: true,
          url: CONTEXT_PATH + '/rest/localizedAttribute/languageOptions',
          model: 'LocaleModel',
          listeners : {
              load : {
                  fn : function(store, r, s, eOpt) {
                      var i, len, record, language,
                      button = Ext.getCmp(this.id + 'LanguageButton');
                      
                      for(i = 0, len = store.getCount(); i < len; i++) {
                          record = store.getAt(i);
                        
                          button.menu.add({text: record.get('displayName'), value: record.get('value'), record: record, handler: function(item, e){
                              var editor = this.findParentByType('htmleditor'),
                              button = Ext.getCmp(editor.id + 'LanguageButton');
                              
                              editor.saveLocale(item, button.activeRecord, i); // save the data with the current record
    
                              button.setText(item.text);
                              button.activeRecord = item.record; // update the active record to the new selection
                              
                              editor.chooseLocale(item, item.record, i);
                          }});
                        
                          if(record.get('isDefault')) {
                            button.setText(record.get('displayName'));
                            button.activeRecord = record;
                            this.defaultLocale = record.get('value');
                          }
                      }
                      
                      if(this.forcedDefaultLocale && this.forcedDefaultLocale !== "") {
                          this.defaultLocale = this.forcedDefaultLocale;
                      }
    
                      if(this.languageJSON) {
                          for(i = 0, len = this.languages.length; i < len; i++) {
                              language = this.languages[i];
                              record = this.languageStore.findRecord('value', language.locale);
                          
                              if (!language.isDefault && language.locale !== null) {
                                  // Only insert entries for missing languages
                                  var recordIndex = this.languageStore.findExact('value', language.locale);
                                  if (recordIndex == -1) {
                                      this.languageStore.insert(
                                              this.languageStore.getTotalCount() - 1, 
                                              new LocaleModel({'value': language.locale, 'displayName': language.displayName, 'isDefault': language.isDefault}));
                                  }
                              }
                              if (this.forcedDefaultLocale && language.locale === this.defaultLocale && record != null) {
                                  this.setupButton(button, language, record);
                              } else if (language.isCurrent) {
                                  this.setupButton(button, language, record);
                              }
                          }
                      }
                      if (this.languages.length === 0) {
                        this.currentLocale = SailPoint.CURR_USER_LOCALE;
                        record = this.languageStore.findRecord('value', this.currentLocale);
                        if (record) {
                          button.setText(record.get('displayName'));
                          button.activeRecord = record;
                        }
                      }
                },
                scope : this
              }
          }
        });
        
        this.callParent(arguments);
        
        var toolbar = this.getToolbar();
        toolbar.add('->', {
            xtype : 'splitbutton',
            id: this.id + 'LanguageButton',
            text: '#{msgs.language}',
            menu: {
                xtype : 'menu',
                items: []
            }
        });

        if (!this.langSelectEnabled) {
          button = Ext.getCmp(this.id + 'LanguageButton');
          button.disable();
          button.hide();
        }
    },
    
    setupButton: function(button, language, record) 
    {
        if (button && language) {
            this.currentLocale = language.locale;
            button.setText(record ? record.get('displayName') : language.displayName);
            button.activeRecord = record;
        }
    },
  
  
  /*******************************************************
   * Override parent getCleanValue to get all entered values 
   * *****************************************************/
  
  getCleanValue: function() {

    /** Add or Save the value that is currently showing in the text editor **/
    var found = false,
    i, len, language,
    button = Ext.getCmp(this.id + 'LanguageButton'),
    activeValue = button.activeRecord.get('value'),
    dName = button.activeRecord.get('displayName');
    
    for(i = 0, len = this.languages.length; i < len; i++) {
        language = this.languages[i];
        if(language.locale === activeValue) {
            /** clean out any line breaks on the value **/
            language.value = this.getValue().replace(/\r/g, '').replace(/\n/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
            this.languages[i] = language;
            found = true;
        }
    }
    
    if(!found) {
        language = {};
        language.locale = activeValue;
        language.displayName = dName;
        /** clean out any line breaks on the value **/
        language.value = this.getValue().replace(/\r/g, '').replace(/\n/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
        this.languages.push(language);
    }
    
    /** Need to clean the values before submitting **/
    this.languageStore.each(function(record) {
        var i, len, language, value,
        name = record.get('value');

        for(i = 0, len = this.languages.length; i < len; i++) {
            language = this.languages[i];
            if(language.locale === name) {
                value = language.value;
                if(value) {
                    value = this.trimValue(this.cleanHtml(value));
                    language.value = value;
                    this.languages[i] = language;
                }
            }
        }
    }, this);
    
    return Ext.JSON.encode(this.languages);
  },
  
  /*******************************************************
   * Language Stuff 
   * *****************************************************/
  
  /** We need to put the description text into the languages array when they switch to a new locale **/
  saveLocale : function(menuItem, record, index) {
      var i, len, language;
        
      this.getCleanValue();
      
      for(i = 0, len = this.languages.length; i < len; i++) {
          language = this.languages[i];
          if(language.locale === record.get('value')) {
              /** clean out any line breaks on the value **/
              language.value = this.getValue().replace(/\r/g, '').replace(/\n/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
          }
      }
  },
  
  chooseLocale : function(menuItem, record, index) {
    
    var i, len, language,
    value = record.get('value');
    
    for(i = 0, len = this.languages.length; i < len; i++) {
        language = this.languages[i];
        
         if(language.locale === record.get('value')) {
            this.setValue(Ext.String.htmlDecode(language.value));
            this.languages[i] = language;
            break;
        }
        else {
            this.setValue(''); // otherwise the old value will remain.
        }
    }
    
    if(menuItem.xtype === 'splitbutton') {
        menuItem.setText(record.get('displayName'));
        menuItem.activeRecord = record;
    }
    
  }
});

Ext.define('LocaleModel', {
  extend: 'Ext.data.Model',
  fields: [
      { name: 'value', type: 'string' },
      { name: 'displayName', type: 'string' },
      { name: 'isDefault', type: 'boolean' }
  ]
});
