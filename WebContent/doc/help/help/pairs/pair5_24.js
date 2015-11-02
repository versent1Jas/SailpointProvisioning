var pairs =
{
"create":{"account":1,"accounts":1}
,"account":{"use":1,"batch":1}
,"use":{"create":1}
,"batch":{"request":1,"requests":1}
,"request":{"create":1,"createaccount":1,"types":1}
,"accounts":{"list":1}
,"list":{"identities":1}
,"identities":{"from":1}
,"from":{"prepared":1}
,"prepared":{"comma-delimited":1}
,"comma-delimited":{"spreadsheet":1}
,"spreadsheet":{"operation":1,"create":1}
,"operation":{"spreadsheet":1,"application":1}
,"createaccount":{"example":1,"adminsapp":1}
,"example":{"operation":1}
,"application":{"nativeidentity":1}
,"nativeidentity":{"identityname":1}
,"identityname":{"email":1}
,"email":{"createaccount":1}
,"adminsapp":{"atoby":1,"jsmith":1}
,"atoby":{"atoby@example.com":1}
,"atoby@example.com":{"createaccount":1}
,"jsmith":{"jsmith@example.com":1}
,"jsmith@example.com":{"additional":1}
,"additional":{"information":1}
,"information":{"batch":1}
,"types":{"examples":1}
,"examples":{"batch":1}
}
;Search.control.loadWordPairs(pairs);