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

  // Get a list of all directories inside the modules folder
  const moduleDirs = fs.readdirSync(path.join(__dirname, '../../../server-modules'), { withFileTypes: true })
   .filter(dirent => dirent.isDirectory())
   .map(dirent => dirent.name);
  // Import all data.js files from the module directories
  for (const moduleDir of moduleDirs) {
   const dataFilePath = path.join(__dirname, '../../../server-modules', moduleDir, 'src/data.js');
   const protocolFilePath = path.join(__dirname, '../../../server-modules', moduleDir, 'src/protocol.js');
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
