/* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved. */

function toggleRunDateInput(input){
    if(input.value == 'false'){
        $('runDateInput').show();
    }else{
        $('runDateInput').hide();
    }
}

function toggleStopOnErrors(input){
    if(input.value == 'false'){
        $('numErrorsInput').show();
    }else{
        $('numErrorsInput').hide();
    }
}
