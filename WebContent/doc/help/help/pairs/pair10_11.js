var pairs =
{
"view":{"approval":1,"comments":1}
,"approval":{"approval":1,"line":1,"item":1}
,"line":{"item":1}
,"item":{"comments":1,"view":1}
,"comments":{"click":1,"button":1,"comments":1,"dialog":1,"from":1,"top":1,"made":1}
,"click":{"comments":1}
,"button":{"approval":1}
,"dialog":{"lists":1}
,"lists":{"comments":1}
,"from":{"oldest":1}
,"oldest":{"newest":1,"comments":1}
,"newest":{"oldest":1}
,"top":{"comment":1}
,"comment":{"following":1,"name":1,"date":1,"posted":1}
,"following":{"information":1}
,"information":{"displayed":1}
,"displayed":{"approvers":1}
,"approvers":{"view":1}
,"made":{"users":1}
,"users":{"posted":1}
,"posted":{"comment":1}
,"name":{"user":1}
,"user":{"posted":1}
,"date":{"time":1}
,"time":{"comment":1}
}
;Search.control.loadWordPairs(pairs);