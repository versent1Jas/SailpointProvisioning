var pairs =
{
"remove":{"entitlement":1,"entitlements":1}
,"entitlement":{"use":1,"batch":1}
,"use":{"remove":1}
,"batch":{"request":1,"requests":1}
,"request":{"remove":1,"removeentitlement":1,"types":1}
,"entitlements":{"from":1}
,"from":{"list":1,"prepared":1}
,"list":{"identities":1}
,"identities":{"from":1}
,"prepared":{"comma-delimited":1}
,"comma-delimited":{"spreadsheet":1}
,"spreadsheet":{"operation":1,"remove":1}
,"operation":{"spreadsheet":1,"application":1}
,"removeentitlement":{"example":1,"procurement_system":1}
,"example":{"operation":1}
,"application":{"attributename":1}
,"attributename":{"attributevalue":1}
,"attributevalue":{"nativeidentity":1}
,"nativeidentity":{"identityname":1}
,"identityname":{"removeentitlement":1}
,"procurement_system":{"group":1,"@audit":1}
,"group":{"@audit":1}
,"@audit":{"id1":1,"id2":1,"id3":1,"id4":1,"id5":1}
,"id1":{"removeentitlement":1}
,"id2":{"removeentitlement":1}
,"id3":{"removeentitlement":1}
,"id4":{"removeentitlement":1}
,"id5":{"additional":1}
,"additional":{"information":1}
,"information":{"batch":1}
,"types":{"examples":1}
,"examples":{"batch":1}
}
;Search.control.loadWordPairs(pairs);
