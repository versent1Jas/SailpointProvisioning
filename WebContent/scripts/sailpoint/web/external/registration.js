/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


/**
 * Override showTimeoutMsg().
 * Display OK button instead of Login Button for registration pages.
 */
function showTimeoutMsg() {
  if(!SailPoint.getTimeoutLock()) {
    Ext.Msg.show(
      {title: "#{msgs.session_expiration_title}",
       msg: "#{msgs.registration_session_expiration_msg}",
       buttons: Ext.Msg.OK,
       buttonText: {
           /** Override the ok button text **/
           ok: '#{msgs.button_ok}'  
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

