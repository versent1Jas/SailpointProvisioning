var pairs =
{
"schedule":{"application":1}
,"application":{"owner":1,"certification":1}
,"owner":{"certification":1}
,"certification":{"use":1,"requests":1,"schedules":1}
,"use":{"following":1}
,"following":{"procedure":1}
,"procedure":{"schedule":1}
,"requests":{"certification":1}
,"schedules":{"complex":1}
,"complex":{"simple":1}
,"simple":{"depending":1}
,"depending":{"specific":1}
,"specific":{"needs":1}
,"needs":{"your":1}
,"your":{"enterprise":1}
,"enterprise":{"purpose":1}
,"purpose":{"certifications":1}
,"certifications":{"scheduled":1}
}
;Search.control.loadWordPairs(pairs);
