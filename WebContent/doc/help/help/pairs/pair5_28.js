var pairs =
{
"selecting":{"deselecting":1}
,"deselecting":{"items":1}
,"items":{"select":1,"click":1,"cancel":1}
,"select":{"item":1,"displayed":1}
,"item":{"click":1,"included":1}
,"click":{"check":1,"deselect":1,"highlighted":1,"home":1}
,"check":{"icon":1}
,"icon":{"associated":1}
,"associated":{"listing":1}
,"listing":{"select":1,"want":1}
,"displayed":{"items":1}
,"deselect":{"item":1,"click":1}
,"highlighted":{"check":1}
,"want":{"selected":1}
,"selected":{"user":1}
,"user":{"access":1}
,"access":{"item":1,"request":1}
,"included":{"your":1}
,"your":{"access":1}
,"request":{"deselect":1}
,"home":{"clear":1}
,"clear":{"items":1}
,"cancel":{"request":1}
}
;Search.control.loadWordPairs(pairs);
