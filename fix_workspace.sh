#!/bin/bash
sed -i '/import { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_DRIVERS, DEFAULT_MATERIALS } from "..\/data\/defaultMasterData";/d' src/services/workspace.service.ts
sed -i 's/DEFAULT_DRIVERS/adminConsoleService.getDrivers()/g' src/services/workspace.service.ts
sed -i 's/DEFAULT_CARRIERS/adminConsoleService.getCarriers()/g' src/services/workspace.service.ts
sed -i 's/DEFAULT_MATERIALS/adminConsoleService.getMaterials()/g' src/services/workspace.service.ts
sed -i 's/DEFAULT_PROJECTS/adminConsoleService.getProjects()/g' src/services/workspace.service.ts

if ! grep -q "import { adminConsoleService }" src/services/workspace.service.ts; then
  sed -i '1s/^/import { adminConsoleService } from ".\/adminConsole.service";\n/' src/services/workspace.service.ts
fi
