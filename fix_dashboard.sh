#!/bin/bash
sed -i '/import { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_MATERIALS, DEFAULT_TRUCKS, DEFAULT_DRIVERS } from "..\/data\/defaultMasterData";/d' src/services/dashboard.service.ts
sed -i 's/DEFAULT_DRIVERS/adminConsoleService.getDrivers()/g' src/services/dashboard.service.ts
sed -i 's/DEFAULT_CARRIERS/adminConsoleService.getCarriers()/g' src/services/dashboard.service.ts
sed -i 's/DEFAULT_MATERIALS/adminConsoleService.getMaterials()/g' src/services/dashboard.service.ts
sed -i 's/DEFAULT_TRUCKS/adminConsoleService.getTrucks()/g' src/services/dashboard.service.ts
sed -i 's/DEFAULT_PROJECTS/adminConsoleService.getProjects()/g' src/services/dashboard.service.ts

if ! grep -q "import { adminConsoleService }" src/services/dashboard.service.ts; then
  sed -i '1s/^/import { adminConsoleService } from ".\/adminConsole.service";\n/' src/services/dashboard.service.ts
fi
