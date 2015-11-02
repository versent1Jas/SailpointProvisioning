/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


Ext.onReady(function() {
  // start the session timeout monitoring process on the current window
  SailPoint.resetTimeout();
});

// Refresh timeout whenever an ajax request is made. This ensures
// that ajaxy pages with no transitions don't timeout . Event is buffered
// so it fires at most once every 5 secs
Ext.Ajax.on('requestcomplete', SailPoint.resetTimeout, this, {
   buffer: 5000
});

// Set the XSRF token in every request header.
// Note: some Ajax components like Ext.data.Connection won't pick up defaultHeaders automatically, so you have
// to set them manually.
Ext.Ajax.defaultHeaders = {
    'X-XSRF-TOKEN' : Ext.util.Cookies.get('CSRF-TOKEN')
};

function doLogout() {
  try {
    populateHeaderFormId();
    $("headerForm:logoutButton").click();
  } catch(e) {}
}

function populateHeaderFormId() {
    // Try to copy the current object's ID in the headerForm
    var editFormId = $('editForm:id');
    var headerFormId = $('headerForm:id');
    if (null != editFormId && null != headerFormId) {
        headerFormId.value = editFormId.value;
    }
}

function showTimeoutMsg() {
  if(!SailPoint.getTimeoutLock()) {
    Ext.Msg.show(
      {title: "#{msgs.session_expiration_title}",
       msg: "#{msgs.session_expiration_msg}",
       buttons: Ext.Msg.OK,
       buttonText: {
           /** Override the ok button text **/
           ok: '#{msgs.button_login}'  
       },
       fn: function(win) {
             // Try to copy the current object's ID in the logoutForm
             // so this will get posted with the preLoginUrl.  This
             // helps us go back to the correct page after an auto-logout.
             var editFormId = $('editForm:id');
             if (null != editFormId) {
                 $('sessionTimeoutForm:id').value = editFormId.value;
             }

             $('sessionTimeoutForm:checkSessionBtn').click();

             return true;
           },
        icon: Ext.MessageBox.ERROR
      });

  } else {
    SailPoint.resetTimeout();
  }
}

if (Ext.isIE8) {
    if(document.createStyleSheet) {
        document.createStyleSheet(CONTEXT_PATH+'/css/ie8.css');
    }
}

if (Ext.isIE9) {
    if(document.createStyleSheet) {
        document.createStyleSheet(CONTEXT_PATH+'/css/ie9.css');
    }
}
