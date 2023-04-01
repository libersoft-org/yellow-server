const path = require('path');
const fs = require('fs');

class Data {
 constructor(options = {}) {
  // Import data.js from the core folder
  const coreDataFilePath = path.join(__dirname, 'data.js');
  if (fs.existsSync(coreDataFilePath)) {
   const coreData = require(coreDataFilePath);
   this.core = new coreData(options);
  }

  function isValidPath(path) {
   try {
    fs.readdirSync(path);
     return true;
    } catch (err) {
     return false;
    }
  }

  // Get a list of all directories inside the modules folder
  let modulesRoot = '../../../server-modules';
  let identityModulePath = path.join(__dirname, modulesRoot);
  if (!isValidPath(identityModulePath)) fs.mkdirSync(identityModulePath);
  const moduleDirs = fs.readdirSync(identityModulePath, { withFileTypes: true })
   .filter(dirent => dirent.isDirectory())
   .map(dirent => dirent.name);
  for (const moduleDir of moduleDirs) {
   const dataFilePath = path.join(__dirname, modulesRoot, moduleDir, 'src/data.js');
   const protocolFilePath = path.join(__dirname, modulesRoot, moduleDir, 'src/protocol.js');
   if (fs.existsSync(dataFilePath) && fs.existsSync(protocolFilePath)) {
    const Data = require(dataFilePath);
    const Protocol = require(protocolFilePath);
    this[moduleDir.split('nemp-server-module-')[1]] = new Data(options);
    this[moduleDir.split('nemp-server-module-')[1] + '-path'] = protocolFilePath;
    this[`${moduleDir.split('nemp-server-module-')[1]}-Protocol`] = new Protocol();
   }
  }
 }
}

module.exports = Data;
