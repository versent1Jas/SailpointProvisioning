var pairs =
{
"mobile":{"approval":1}
,"approval":{"tasks":1,"forward":1,"view":1}
,"tasks":{"perform":1,"complete":1}
,"perform":{"following":1}
,"following":{"tasks":1}
,"complete":{"approval":1}
,"forward":{"approval":1}
,"view":{"details":1,"post":1}
,"details":{"view":1}
,"post":{"comments":1}
,"comments":{"edit":1}
,"edit":{"approval":1}
}
;Search.control.loadWordPairs(pairs);
