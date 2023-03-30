const path = require('path');
const fs = require('fs');
const Logger = require('./utils/logger');

class NempModulesLoader {
  constructor() {
    this.logger = new Logger();
    this.logger.log('[NEMP Modules loader] start initializing modules');
    this.modules = {};
    this.failedModules = {};
    this.initModules();
  }

  static moduleStructureValidationTest(modulePath) {
    const requireStructure = {
      'module.js': false,
      'data.js': false,
    };

    const fileNames = fs.readdirSync(modulePath);
    fileNames.forEach((fileName) => {
      if (requireStructure[fileName] !== undefined) {
        requireStructure[fileName] = true;
      }
    });

    const testResult = Object.keys(requireStructure).reduce((acc, fileName) => {
      if (requireStructure[fileName] === false) {
        return false;
      }
      return acc;
    }, true);

    return {
      isValid: testResult,
      detail: requireStructure,
    };
  }

  initModules() {
    const nempModulesPath = path.resolve(__dirname, './nemp-modules');
    const modules = fs.readdirSync(nempModulesPath);

    modules.forEach((module) => {
      const modulePath = path.resolve(nempModulesPath, module);
      const isDirectory = fs.lstatSync(modulePath).isDirectory();
      if (!isDirectory) return;

      const structureTest = NempModulesLoader.moduleStructureValidationTest(modulePath);
      if (structureTest.isValid) {
        this.logger.log(`[NEMP Modules loader] Module: ${module} - structure test OK`);
        try {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const Module = require(`${path.resolve(modulePath, 'module.js')}`);
          const moduleInstance = new Module();

          this.modules[moduleInstance.moduleName] = {
            status: 'success',
            instance: moduleInstance,
            path: modulePath,
          };
        } catch (error) {
          console.error(error);
          this.failedModules[module] = {
            path: modulePath,
            error: error.message,
          };
        }
      } else {
        this.logger.log(`[NEMP Modules loader] Module: ${module} - structure failed! \n ${JSON.stringify(structureTest.detail)}`);
      }
    });

    this.logger.log(JSON.stringify(this.modules));
  }

  getModuleInstance(moduleName) {
    if (this.modules[moduleName]) {
      return this.modules[moduleName].instance;
    }
    this.logger.log(`[NEMP Modules loader] Module: ${module} - get module instance failed`);
    return null;
  }
}

module.exports = NempModulesLoader;
