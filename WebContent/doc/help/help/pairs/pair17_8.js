var pairs =
{
"post":{"assignment":1}
,"assignment":{"note":1,"notes":1}
,"note":{"access":1,"line":1,"permitted":1,"text":1}
,"access":{"request":1}
,"request":{"line":1,"post":1}
,"line":{"items":1,"item":1}
,"items":{"complete":1,"roles":1}
,"complete":{"access":1}
,"roles":{"assignment":1}
,"permitted":{"item":1}
,"item":{"assignment":1,"comments":1}
,"notes":{"tab":1,"dialog":1}
,"tab":{"displayed":1,"select":1,"type":1}
,"displayed":{"review":1}
,"review":{"tab":1}
,"select":{"comments":1,"assignment":1}
,"comments":{"icon":1,"notes":1}
,"icon":{"next":1}
,"next":{"line":1}
,"dialog":{"select":1}
,"type":{"your":1}
,"your":{"note":1}
,"text":{"box":1}
,"box":{"click":1}
,"click":{"save":1}
}
;Search.control.loadWordPairs(pairs);
