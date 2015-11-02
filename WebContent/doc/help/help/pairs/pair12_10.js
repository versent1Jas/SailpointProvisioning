var pairs =
{
"edit":{"approval":1}
,"approval":{"following":1,"change":1}
,"following":{"edits":1}
,"edits":{"approval":1}
,"change":{"priority":1,"sunrise\u002Fsunset":1,"remove":1}
,"priority":{"change":1}
,"sunrise\u002Fsunset":{"dates":1}
,"dates":{"change":1}
,"remove":{"workgroup":1}
,"workgroup":{"assignee":1}
}
;Search.control.loadWordPairs(pairs);
