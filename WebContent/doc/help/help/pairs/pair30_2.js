var pairs =
{
"how":{"schedule":1}
,"schedule":{"identity":1,"description":1,"certification":1}
,"identity":{"certification":1}
,"certification":{"use":1,"certification":1,"schedules":1,"schedule":1,"field":1}
,"use":{"following":1}
,"following":{"procedure":1}
,"procedure":{"schedule":1,"lists":1}
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
,"scheduled":{"procedure":1}
,"lists":{"basic":1}
,"basic":{"steps":1}
,"steps":{"required":1}
,"required":{"launch":1}
,"launch":{"identity":1}
,"description":{"options":1}
,"options":{"available":1}
,"available":{"page":1}
,"page":{"schedule":1}
,"field":{"descriptions":1}
}
;Search.control.loadWordPairs(pairs);
