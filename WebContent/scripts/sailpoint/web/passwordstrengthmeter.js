// Password strength meter
//
// http://ajaxorized.com/examples/scriptaculous/pastrength/

// check if confirm password field matches original
function checkMatch(pw) {
   if (pw.length == 0) {
     return;
   }
   var passwd = $F('expiredForm:newPassword'); 
   if (passwd == pw) {
     $('expiredForm:confirmCheck').src = 'images/icons/dialogue_success_16.png';
   }
   else {
     $('expiredForm:confirmCheck').src = 'images/icons/dialogue_error_16.png';
   }
}

var m_strUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var m_strLowerCase = "abcdefghijklmnopqrstuvwxyz";
var m_strNumber = "0123456789";
var m_strCharacters = "!@#$%^&*?_~"

function checkPassword(strPassword)
{
    // Reset combination count
    var nScore = 0;

    // Password length
    // -- Less than 4 characters
    if (strPassword.length < 5)
    {
        nScore += 5;
    }
    // -- 5 to 7 characters
    else if (strPassword.length > 4 && strPassword.length < 8)
    {
        nScore += 10;
    }
    // -- 8 or more
    else if (strPassword.length > 7)
    {
        nScore += 25;
    }

    // Letters
    var nUpperCount = countContain(strPassword, m_strUpperCase);
    var nLowerCount = countContain(strPassword, m_strLowerCase);
    var nLowerUpperCount = nUpperCount + nLowerCount;
    // -- Letters are all lower case
    if (nUpperCount == 0 && nLowerCount != 0) 
    { 
        nScore += 10; 
    }
    // -- Letters are upper case and lower case
    else if (nUpperCount != 0 && nLowerCount != 0) 
    { 
        nScore += 20; 
    }

    // Numbers
    var nNumberCount = countContain(strPassword, m_strNumber);
    // -- 1 number
    if (nNumberCount == 1)
    {
        nScore += 10;
    }
    // -- 3 or more numbers
    if (nNumberCount >= 3)
    {
        nScore += 20;
    }

    // Characters
    var nCharacterCount = countContain(strPassword, m_strCharacters);
    // -- 1 character
    if (nCharacterCount == 1)
    {
        nScore += 10;
    }   
    // -- More than 1 character
    if (nCharacterCount > 1)
    {
        nScore += 25;
    }

    // Bonus
    // -- Letters and numbers
    if (nNumberCount != 0 && nLowerUpperCount != 0)
    {
        nScore += 2;
    }
    // -- Letters, numbers, and characters
    if (nNumberCount != 0 && nLowerUpperCount != 0 && nCharacterCount != 0)
    {
        nScore += 3;
    }
    // -- Mixed case letters, numbers, and characters
    if (nNumberCount != 0 && nUpperCount != 0 && nLowerCount != 0 && nCharacterCount != 0)
    {
        nScore += 5;
    }


    return nScore;
}

// Runs password through check and then updates GUI 
function runPassword(strPassword) 
{
    // Check password
    var nScore = checkPassword(strPassword);

    // Get controls
    var ctlText = document.getElementById("psStrengthText");
    if (!ctlText) {
        alert('element not found');
        return;
    }

    if (nScore >= 80)
    {
        var strText = "#{msgs.pass_strength_level_very_strong}";
        var strColor = "#008000";
    }
    // -- Strong
    else if (nScore >= 60)
    {
        var strText = "#{msgs.pass_strength_level_strong}";
        var strColor = "#006000";
    }
    // -- Average
    else if (nScore >= 40)
    {
        var strText = "#{msgs.pass_strength_level_average}";
        var strColor = "#e3cb00";
    }
    // -- Weak
    else if (nScore >= 20)
    {
        var strText = "#{msgs.pass_strength_level_weak}";
        var strColor = "#Fe3d1a";
    }
    // -- Very Weak
    else
    {
        var strText = "#{msgs.pass_strength_level_very_weak}";
        var strColor = "#e71a1a";
    }

    ctlText.style.color = strColor;

    if(strPassword.length == 0)
    {
        ctlText.innerHTML =  "";
    }
    else
    {
        ctlText.innerHTML = Ext.String.format('#{msgs.pass_strength_format}', strText);
    }
}

// Checks a string for a list of characters
function countContain(strPassword, strCheck)
{ 
    // Declare variables
    var nCount = 0;

    for (i=0;i<strPassword.length;++i) 
    {
        if (strCheck.indexOf(strPassword.charAt(i)) > -1) 
        { 
            nCount++;
        } 
    } 
    return nCount; 
} 
