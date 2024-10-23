import path from 'path';

class Info {
 static appName = 'Yellow Server';
 static appVersion = '0.01';
 static appPath = path.dirname(import.meta.dir) + '/';
 static settingsFile = import.meta.env.VITE_YELLOW_SETTINGS_PATH || path.join(path.dirname(import.meta.dir), 'settings.json');
 static settings;
}

export { Info };
