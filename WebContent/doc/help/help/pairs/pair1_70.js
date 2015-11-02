var pairs =
{
"risk":{"reports":1,"live":1}
,"reports":{"applications":1}
,"applications":{"risk":1}
,"live":{"report":1}
,"report":{"identity":1,"risky":1}
,"identity":{"risk":1}
,"risky":{"accounts":1}
,"accounts":{"report":1}
}
;Search.control.loadWordPairs(pairs);
