var pairs =
{
"procedure":{"click":1}
,"click":{"monitor":1,"schedule":1}
,"monitor":{"tab":1}
,"tab":{"scroll":1,"select":1,"task":1}
,"scroll":{"tab":1}
,"select":{"certifications":1,"entitlement":1,"applications":1,"specific":1,"execution":1,"run":1}
,"certifications":{"select":1,"require":1}
,"entitlement":{"owner":1}
,"owner":{"from":1}
,"from":{"schedule":1,"application":1,"drop-down":1}
,"schedule":{"new":1,"certification":1}
,"new":{"certification":1}
,"certification":{"drop-down":1,"request":1,"from":1,"schedules":1,"first":1,"start":1,"click":1,"schedule":1}
,"drop-down":{"list":1}
,"list":{"select":1,"continuous":1}
,"applications":{"schedule":1,"select":1,"from":1}
,"request":{"data":1}
,"data":{"owners":1}
,"owners":{"applications":1}
,"specific":{"applications":1}
,"application":{"field":1}
,"field":{"select":1}
,"execution":{"frequency":1}
,"frequency":{"certification":1}
,"continuous":{"certifications":1}
,"require":{"additional":1}
,"additional":{"information":1}
,"information":{"certification":1}
,"schedules":{"tab":1}
,"task":{"run":1,"scheduled":1}
,"run":{"across":1,"time":1,"4:00":1,"1:00":1,"select":1,"now":1}
,"across":{"time":1}
,"time":{"zones":1,"scheduled":1,"zone":1,"certification":1,"example":1,"11:42":1}
,"zones":{"run":1}
,"scheduled":{"relative":1,"example":1,"run":1}
,"relative":{"time":1}
,"zone":{"scheduled":1}
,"example":{"task":1,"currently":1}
,"4:00":{"pdt":1}
,"pdt":{"run":1}
,"1:00":{"edt":1}
,"edt":{"specify":1}
,"specify":{"date":1,"duration":1}
,"date":{"time":1}
,"first":{"run":1}
,"now":{"certification":1}
,"start":{"times":1,"time":1}
,"times":{"least":1}
,"least":{"minute":1}
,"minute":{"later":1}
,"later":{"current":1,"lifecycle":1}
,"current":{"time":1}
,"currently":{"11:41":1}
,"11:41":{"certification":1}
,"11:42":{"later":1}
,"lifecycle":{"panel":1}
,"panel":{"specify":1}
,"duration":{"active":1}
,"active":{"period":1}
,"period":{"certification":1}
}
;Search.control.loadWordPairs(pairs);
