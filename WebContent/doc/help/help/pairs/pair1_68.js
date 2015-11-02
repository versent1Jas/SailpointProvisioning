var pairs =
{
"identity":{"user":1,"effective":1,"entitlements":1,"forwarding":1,"status":1}
,"user":{"reports":1,"access":1,"account":1,"details":1}
,"reports":{"account":1}
,"account":{"attributes":1,"summary":1,"attribute":1,"authentication":1}
,"attributes":{"live":1,"report":1}
,"live":{"report":1}
,"report":{"application":1,"identity":1,"privileged":1,"uncorrelated":1,"user":1,"users":1}
,"application":{"account":1,"report":1}
,"summary":{"report":1}
,"attribute":{"report":1}
,"effective":{"access":1}
,"access":{"live":1,"report":1}
,"entitlements":{"detail":1}
,"detail":{"report":1}
,"forwarding":{"report":1}
,"status":{"summary":1,"report":1}
,"privileged":{"user":1}
,"uncorrelated":{"accounts":1}
,"accounts":{"report":1}
,"authentication":{"question":1}
,"question":{"status":1}
,"details":{"report":1}
,"users":{"application":1}
}
;Search.control.loadWordPairs(pairs);