# TOOLCHAIN CONTRACT
## Q-Saudi Work Follow Reconstruction

### Canonical Toolchain Specification
- **Canonical Package Manager**: npm
- **Package Manager Version**: 10.9.8
- **Canonical Lockfile**: `package-lock.json`
- **Supported Node Major Version**: 22
- **Node Engine Constraint**: `>=22 <23`
- **NPM Engine Constraint**: `>=10 <11`
- **Clean Install Command**: `npm ci --no-audit --no-fund`
- **Local Dependency Change Command**: `npm install`
- **CI Install Command**: `npm ci`
- **Alternate Package Manager Lockfiles**: Non-canonical lockfiles (e.g., `bun.lock`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`) must not be tracked and are ignored.
