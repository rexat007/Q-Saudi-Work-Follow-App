#!/bin/bash
sed -i '/import { SAMPLE_QUALITY_CONTEXT } from/d' src/services/tripEngine.service.ts
sed -i 's/const context = SAMPLE_QUALITY_CONTEXT;/const context = buildRelationshipContext(params.projectId || "ALL");/g' src/services/tripEngine.service.ts
sed -i 's/const isMatchingPlate = SAMPLE_QUALITY_CONTEXT/const isMatchingPlate = buildRelationshipContext("ALL")/g' src/services/tripEngine.service.ts
sed -i '1s/^/import { buildRelationshipContext } from "..\/utils\/masterDataUtils";\n/' src/services/tripEngine.service.ts
