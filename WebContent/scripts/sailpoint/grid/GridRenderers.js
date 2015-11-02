Ext.ns('SailPoint.grid.GridRenderers');

//Takes a boolean and converts it to Offline with a red circle if true or Online with a green circle if false
SailPoint.grid.GridRenderers.renderIsOnline = function(value, p, record) {
    var str = '<div class=\'riskIndicator ri_{0}\'>{1}</div>';
    return Ext.String.format(str, value?"ff0000":"00ff00", value?"#{msgs.host_config_offline}":"#{msgs.host_config_online}");
}

//Takes a percentage (ie 15%) and displays it as a colored bar with the original percent to the right
SailPoint.grid.GridRenderers.renderPercentBar = function(value, p, record) {
    var percent = parseFloat(value);
    if(percent < 0 || percent > 100){
    	percent = 0;
    }
    
	var str = '<div class="progressBar" style="width: 150px"><span class="progressBarComplete{0}" style=" width: {1}px; left: 1.0px; z-index: 4">'+
    	'</span><span class="progressBarRemainingLightGray" style=" width: 148px; left: 1px"></span></div>';
    if(percent > 50 && percent <= 90){
    	return Ext.String.format(str, 'Yellow', percent*1.48);
    }else if(percent > 90){
    	return Ext.String.format(str, 'Red', percent*1.48);
    }
    //default to green
    return Ext.String.format(str, '', percent*1.48);
}