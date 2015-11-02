var pairs =
{
"account":{"group":1}
,"group":{"reports":1,"members":1,"membership":1}
,"reports":{"account":1}
,"members":{"report":1}
,"report":{"account":1}
,"membership":{"totals":1}
,"totals":{"report":1}
}
;Search.control.loadWordPairs(pairs);
