***NOTICE*** DO NOT EDIT THE EXT SOURCE FILES!!  If you need to patch something, make an override in ext-patches.js!!!!
Please include a bug number and description of what/where/why/when for tracking.


[Known Ext bugs that (may) affect IdentityIQ.  Feel free to remove if it gets fixed, or is not applicable.]
http://www.sencha.com/forum/showthread.php?191898-Ext.grid.Panel-forceFit-option-should-not-affect-Ext.selection.CheckboxModel-column
http://www.sencha.com/forum/showthread.php?124702-OPEN-ComboBox-s-setValue-call-with-a-remotely-loaded-Store
http://www.sencha.com/forum/showthread.php?190385-RC1-Bug-in-set-focus-on-IE
http://www.sencha.com/forum/showthread.php?192080-4.1-RC1-this.dockedItems.get-is-not-a-function
http://www.sencha.com/forum/showthread.php?141131-Valid-HTML-id-not-supported-in-column-id.-Example-id-with-colon-(-)-in-identifer
http://www.sencha.com/forum/showthread.php?159943-Can-t-override-singleton

[Dustin Dobervich 3/30/12]
On Analyze -> Reports getting this.dockedItems.get is not a function. I believe 
this is a bug within Ext 4.1RC1 itself. I have reported it here: 
http://www.sencha.com/forum/showthread.php?192080-4.1-RC1-this.dockedItems.get-is-not-a-function

UPDATE: It was actually our code causing this and I have fixed it in Revision 32056

UPDATE 2: This actually is a problem with ext js and I have modifed the Ext.panel.AbstractPanel to fix:

    initItems : function() {
        // [SailPoint]: init docking items first
        this.initDockingItems();
        this.callParent();
    },


[Michael Hide 3/30/12]
Modified Ext.grid.plugin.Editing.addHeaderEvents() to use the passed in gridView.el instead of this.el (which was null).

        //[SailPoint] Use the passed in gridView.el instead of this.el if it's null.
        var vEl = me.view.el;
        if(!vEl && gView && gView.el){
            vEl = gView.el;
        }
        
        me.keyNav = Ext.create('Ext.util.KeyNav', vEl, {


[Jeff Upton 3/31/12]
Our override of getValue/setValue on Ext.form.RadioGroup in SailPoint.js is causing some problems. 
We changed the semantics of the methods, and they are called internally by other RadioGroup methods. 
I've changed the methods to getGroupValue/setGroupValue. These should be used wherever getValue/setValue are being used now.


[Michael Hide 4/2/12]
Added check for null classList in AbstractElement override about line 11857:
from
return (dom && className) ? dom.classList.contains(className) : false;
to
return (dom && dom.classList && className) ? dom.classList.contains(className) : false;


[Michael Hide 4/2/12]
Fixed issue with toQueryString() where it would add functions to the query instead of just strings and numbers.
from
if (object.hasOwnProperty(i)) {
to
if (object.hasOwnProperty(i) && typeof object[i] !== "function") {


[Michael Hide 4/10/12]
Re-implemented fix for bug #4051
from
window.execScript(match[2]);
to
window.execScript(match[2].replace(/^<!--/,"").replace(/-->$/, "")));
