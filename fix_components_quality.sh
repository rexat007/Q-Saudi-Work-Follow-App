#!/bin/bash
FILES="
src/components/field/LoadingOperatorView.tsx
src/components/field/UnloadingOperatorView.tsx
src/components/tripEngine/LoadingStation.tsx
src/components/importCenter/ImportCenterView.tsx
src/components/dataQuality/DataQualityView.tsx
src/components/TripEngineView.tsx
"

for f in $FILES; do
  sed -i '/import { SAMPLE_QUALITY_CONTEXT } from/d' "$f"
  sed -i 's/const context = SAMPLE_QUALITY_CONTEXT;/const context = buildRelationshipContext("ALL");/g' "$f"
  sed -i 's/SAMPLE_QUALITY_CONTEXT/buildRelationshipContext("ALL")/g' "$f"
  
  if grep -q 'buildRelationshipContext' "$f"; then
    if [[ "$f" == *"src/components/field/"* ]] || [[ "$f" == *"src/components/tripEngine/"* ]] || [[ "$f" == *"src/components/importCenter/"* ]] || [[ "$f" == *"src/components/dataQuality/"* ]]; then
       sed -i '1s/^/import { buildRelationshipContext } from "..\/..\/utils\/masterDataUtils";\n/' "$f"
    elif [[ "$f" == *"src/components/TripEngineView.tsx"* ]]; then
       sed -i '1s/^/import { buildRelationshipContext } from "..\/utils\/masterDataUtils";\n/' "$f"
    fi
  fi
done
