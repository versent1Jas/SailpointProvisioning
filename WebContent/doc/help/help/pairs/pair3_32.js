var pairs =
{
"create":{"identity":1,"list":1}
,"identity":{"use":1,"batch":1}
,"use":{"create":1}
,"batch":{"request":1,"requests":1}
,"request":{"create":1,"createidentity":1,"types":1}
,"list":{"identities":1}
,"identities":{"from":1}
,"from":{"prepared":1}
,"prepared":{"comma-delimited":1}
,"comma-delimited":{"spreadsheet":1}
,"spreadsheet":{"operation":1,"create":1}
,"operation":{"spreadsheet":1,"name":1}
,"createidentity":{"example":1,"alex":1,"bob":1,"mark":1,"john":1}
,"example":{"operation":1}
,"name":{"location":1}
,"location":{"email":1}
,"email":{"department":1}
,"department":{"createidentity":1}
,"alex":{"smith":1}
,"smith":{"austin":1}
,"austin":{"asmith@adept.com":1,"johnsmith@adept.com":1}
,"asmith@adept.com":{"accounting":1,"engineering":1}
,"accounting":{"createidentity":1}
,"bob":{"smith":1}
,"engineering":{"createidentity":1}
,"mark":{"smith":1}
,"john":{"smith":1}
,"johnsmith@adept.com":{"finance":1}
,"finance":{"additional":1}
,"additional":{"information":1}
,"information":{"batch":1}
,"types":{"examples":1}
,"examples":{"batch":1}
}
;Search.control.loadWordPairs(pairs);
