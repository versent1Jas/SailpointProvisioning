var pairs =
{
"access":{"review":1}
,"review":{"certification":1,"decision":1,"signoff":1,"live":1,"report":1}
,"certification":{"reports":1,"activity":1}
,"reports":{"access":1}
,"decision":{"report":1}
,"report":{"access":1,"account":1,"advanced":1,"application":1,"certification":1,"entitlement":1,"manager":1,"role":1}
,"signoff":{"live":1}
,"live":{"report":1}
,"account":{"group":1}
,"group":{"access":1}
,"advanced":{"access":1}
,"application":{"owner":1,"report":1}
,"owner":{"access":1}
,"activity":{"application":1}
,"entitlement":{"owner":1}
,"manager":{"access":1}
,"role":{"access":1}
}
;Search.control.loadWordPairs(pairs);
