// Patch for ansi-regex import issue
// This fixes the "ansiRegex.default is not a function" error

if (typeof global !== 'undefined') {
  const originalRequire = global.require;
  if (originalRequire) {
    global.require = function(moduleId) {
      const module = originalRequire(moduleId);

      // Fix ansi-regex import
      if (moduleId === 'ansi-regex' || moduleId.includes('ansi-regex')) {
        if (module && typeof module === 'object' && !module.default) {
          module.default = module;
        }
      }

      return module;
    };
  }
}