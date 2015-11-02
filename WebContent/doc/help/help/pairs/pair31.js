var pairs =
{
"how":{"perform":1}
,"perform":{"multi-level":1}
,"multi-level":{"sign":1,"sign-off":1}
,"sign":{"access":1,"multi-level":1,"receive":1,"finished":1,"rule":1,"actions":1}
,"access":{"reviews":1,"review":1,"access":1}
,"reviews":{"perform":1,"require":1,"access":1,"assigned":1,"complete":1}
,"sign-off":{"access":1,"actions":1}
,"require":{"person":1,"users":1}
,"person":{"review":1}
,"review":{"sign":1,"access":1,"assigned":1,"request":1,"changes":1,"complete":1}
,"assigned":{"certifier":1,"additional":1}
,"certifier":{"completed":1}
,"completed":{"signed":1}
,"signed":{"require":1}
,"users":{"review":1}
,"complete":{"access":1,"additional":1}
,"additional":{"sign":1}
,"receive":{"email":1}
,"email":{"notification":1}
,"notification":{"access":1}
,"request":{"sent":1,"access":1}
,"sent":{"your":1}
,"your":{"dashboard":1}
,"dashboard":{"inbox":1}
,"inbox":{"access":1}
,"changes":{"add":1}
,"add":{"comments":1}
,"comments":{"required":1}
,"required":{"click":1,"process":1,"access":1}
,"click":{"sign":1}
,"finished":{"sign":1}
,"rule":{"runs":1,"determines":1}
,"runs":{"again":1}
,"again":{"determine":1}
,"determine":{"access":1}
,"actions":{"required":1}
,"process":{"repeated":1}
,"repeated":{"until":1}
,"until":{"rule":1}
,"determines":{"further":1}
,"further":{"sign-off":1}
}
;Search.control.loadWordPairs(pairs);
