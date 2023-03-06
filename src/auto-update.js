const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const App = require('./libs/app.js');
const Common = require('./libs/common.js').Common;
new App().loadSettings();
const exceptFolder = 'src';
(function adminRepo() {
    const adminRepoPath = Common.settings.web_root + '/nemp-admin-web';
    const newAdminRepoPath = Common.settings.web_root + '/admin';
    const adminRemoteUrl = 'https://github.com/claudwatari95/nemp-admin-web.git';
    fs.rmdirSync(adminRepoPath);
    simpleGit().clone(adminRemoteUrl, adminRepoPath, (errCloning, result) => {
        if (errCloning) {
          console.error(`Error cloning repository: ${errCloning}`);
        } else {
          console.log(`Repository cloned successfully: ${result}`);
          simpleGit(adminRepoPath).pull(adminRemoteUrl, (errPulling, pullResult) => {
              if (errPulling) {
              console.error(`Error cloning repository: ${errPulling}`);
              } else {
              console.log(`Repository cloned successfully to ${pullResult}`);
              fs.readdir(adminRepoPath, (errDeleting, files) => {
                  if (errDeleting) {
                    return console.error(errDeleting);
                  } files.forEach((file) => {
                      const filePath = path.join(adminRepoPath, file);
                      if (file !== exceptFolder) {
                        if (fs.statSync(filePath).isDirectory()) {
                            fs.rmdirSync(filePath, { recursive: true });
                            console.log(`Deleted folder ${file}`);
                        } else {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted file ${file}`);
                        }
                      }
                      fs.rename(adminRepoPath, newAdminRepoPath, (errMoving) => {
                        if (err) {
                          console.error(`Error moving folder: ${errMoving}`);
                        } else {
                          console.log('Folder moved successfully');
                          fs.rmdirSync(adminRepoPath);
                        }
                      });
                  });
              });
              }
          });
        }
      });
})();
