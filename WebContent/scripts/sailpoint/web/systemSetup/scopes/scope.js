function testNewScope() {
  var scopeName = $('editForm:displayName').value;
  if (isEmptyOrNull(scopeName)) {
    scopeName = null;
  }
  var parentId = $('editForm:newScopeParentId').value;
  if (isEmptyOrNull(parentId)) {
    parentId = null;
  }
  Ext.Ajax.request({
    url: SailPoint.getRelativeUrl('/systemSetup/scopes/scopeExists.json'),
    params: {scopeName:scopeName, parentId:parentId},
    success: function(response, opts) {
      var obj = Ext.decode(response.responseText);
      if (obj.exists === true) {
        log('scope already exists');
        Ext.Msg.confirm('#{scope_exists_different_context_title}', 
          '#{confirm_duplicate_scope}', 
          function(btn){
            log('parentScopeName: ' + obj.parentScopeName);
            if (btn === 'yes') {
              log('creating new scope');
              $('editForm:createBtn').click();
            } else {
              log('not creating scope');
            }
          });
      } else {
        log('scope does not exist, creating scope');
        $('editForm:createBtn').click();
      }
    },
    failure: function(response, opts) {
      alert('failed ajax ' + Ext.decode(response.responseText));
    }
  });
}
/**
 * tqm: move these to some util class
 */
function isEmptyOrNull(str) {
  if (typeof(str) == 'undefined') {
    return true;
  }
  if (str === null) {
    return true;
  }
  if (typeof(str) != 'string') {
    return false;
  }
  if (str.trim().length == 0) {
    return true;
  }
}
function log(msg) {
  if (typeof(console) != 'undefined') {
    console.log(msg);
  }
}
