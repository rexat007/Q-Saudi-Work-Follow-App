# Observed cross-domain imports

Directed edges count resolved static import/export declarations at the pinned base.
These are module dependencies, not proof of runtime calls or authorization.

```mermaid
graph LR
  N0["Firebase"]
  N1["HTTP and workers"]
  N2["Import"]
  N3["Offline"]
  N4["Other source"]
  N5["Repositories"]
  N6["Runtime fences"]
  N7["SQL"]
  N8["Services"]
  N9["Tests"]
  N10["Types"]
  N11["UI"]
  N0 -->|3| N4
  N0 -->|2| N6
  N0 -->|2| N10
  N1 -->|5| N0
  N1 -->|11| N4
  N1 -->|2| N6
  N1 -->|19| N7
  N1 -->|41| N8
  N1 -->|11| N10
  N2 -->|8| N0
  N2 -->|29| N4
  N2 -->|5| N5
  N2 -->|28| N8
  N2 -->|79| N10
  N3 -->|2| N0
  N3 -->|4| N4
  N3 -->|3| N5
  N3 -->|7| N8
  N3 -->|12| N10
  N4 -->|2| N0
  N4 -->|7| N1
  N4 -->|1| N2
  N4 -->|3| N3
  N4 -->|1| N5
  N4 -->|4| N6
  N4 -->|7| N8
  N4 -->|65| N10
  N4 -->|22| N11
  N5 -->|41| N0
  N5 -->|17| N4
  N5 -->|21| N10
  N6 -->|1| N0
  N6 -->|1| N4
  N6 -->|3| N8
  N6 -->|4| N10
  N6 -->|6| N11
  N7 -->|16| N2
  N7 -->|25| N4
  N7 -->|10| N8
  N7 -->|13| N10
  N8 -->|43| N0
  N8 -->|3| N1
  N8 -->|35| N2
  N8 -->|3| N3
  N8 -->|126| N4
  N8 -->|64| N5
  N8 -->|3| N6
  N8 -->|163| N10
  N9 -->|64| N0
  N9 -->|71| N1
  N9 -->|198| N2
  N9 -->|32| N3
  N9 -->|321| N4
  N9 -->|149| N5
  N9 -->|9| N6
  N9 -->|96| N7
  N9 -->|499| N8
  N9 -->|193| N10
  N9 -->|90| N11
  N10 -->|2| N2
  N10 -->|1| N3
  N10 -->|4| N4
  N10 -->|4| N8
  N11 -->|11| N0
  N11 -->|64| N2
  N11 -->|18| N3
  N11 -->|189| N4
  N11 -->|21| N5
  N11 -->|15| N6
  N11 -->|81| N8
  N11 -->|11| N9
  N11 -->|118| N10
```

All 5,480 individual references are in `imports.csv`. The compressed source map
includes 105,571 syntactic call sites, data-access candidates, routes, type references,
declarations and the content-verified inventory. The supplementary
`dynamic-module-edges.json` records and resolves 144 literal dynamic imports
(70 production/tooling, 74 test) and 15 direct CommonJS import/resolve calls.
The static-declaration diagram above does not include those edge counts.
All relative dynamic module references resolved. Combined declaration/dynamic/
CommonJS reachability still finds no path from `src/main.tsx` to the standalone
ExceptionEngineView or settlementAdjustment service; FieldSupervision's
process-local exception engine remains reachable.

Computed route candidates, reflection and injected runtime implementations
remain explicit limits; a syntactic call is not a proven runtime call target.
