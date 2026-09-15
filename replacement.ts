  public async loadDemoMasterData(): Promise<void> {
    const { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_MATERIALS, DEFAULT_TRUCKS, DEFAULT_DRIVERS } = await import('../data/defaultMasterData');
    this.projects = [...DEFAULT_PROJECTS];
    this.carriers = [...DEFAULT_CARRIERS];
    this.materials = [...DEFAULT_MATERIALS];
    this.trucks = [...DEFAULT_TRUCKS];
    this.drivers = [...DEFAULT_DRIVERS];
    await this.initializePricingRules();
    this.initializeUsers();
    this.initializeExceptions();
  }
