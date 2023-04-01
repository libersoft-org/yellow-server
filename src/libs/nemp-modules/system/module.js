const os = require('os');
const NempModule = require('../../main-module/nemp-module');
const Response = require('../../response');

class System extends NempModule {
  constructor() {
    super();
    this.moduleName = 'System';
    this.moduleVersion = '1.0.0';
    this.commands = {
      system_info: {
        auth: 'admin',
        run: System.getSystemInfo,
      },
    };

    this.logger.log(this.getModuleInfo());
  }

  static getSystemInfo(command) {
    const networks = [];
    const net = os.networkInterfaces();
    for (const iface in net) {
      const ifc = {};
      if (iface != 'lo') {
        const addresses = [];
        for (let i = 0; i < net[iface].length; i++) addresses.push(net[iface][i].address);
        ifc[iface] = addresses;
        networks.push(ifc);
      }
    }
    let secs = Math.floor(os.uptime());
    let mins = Math.floor(secs / 60);
    let hours = Math.floor(mins / 60);
    let days = Math.floor(hours / 24);
    days %= 24;
    hours %= 60;
    mins %= 60;
    secs %= 60;
    const updateTime = function (original_time) {
      const originalFormat = '20 days, 40 hours, 57 min';
      // Convert original format into a date object
      const date = new Date();
      date.setDate(parseInt(originalFormat.split(' ')[0]) + 1); // Add 1 day
      date.setHours(parseInt(originalFormat.split(', ')[1]) - 24); // Subtract 24 hours
      date.setMinutes(parseInt(originalFormat.split(', ')[2])); // Keep minutes the same
      // Format resulting date object into desired output format: "21 days, 16 hours, 57 min"
      const outputFormat = `${date.getDate()} days, ${date.getHours()} hours, ${date.getMinutes()} minutes, ${secs} seconds`;
      return outputFormat;
    };
    const uptime = updateTime(`${days} days, ${hours} hours, ${mins} minutes, ${secs} seconds`);
    const totalMemory = os.totalmem(); const
      freeMemory = os.freemem();
    const totalMemInKb = totalMemory / 1024; const
      free_mem_in_kb = freeMemory / 1024;
    const total_mem_in_mb = totalMemInKb / 1024; const
      free_mem_in_mb = free_mem_in_kb / 1024;
    const total_mem_in_gb = total_mem_in_mb / 1024; const
      free_mem_in_gb = free_mem_in_mb / 1024;

    return Response.sendData(command, {
      // app_name: Common.appName,
      // app_version: Common.appVersion,
      os_name: os.type(),
      os_version: os.release(),
      cpu_model: os.cpus()[0].model,
      cpu_cores: os.cpus().length,
      cpu_arch: os.arch(),
      cpu_load: Math.min(Math.floor(os.loadavg()[0] * 100 / os.cpus().length), 100),
      ram_total: total_mem_in_gb,
      ram_free: free_mem_in_gb,
      hostname: os.hostname(),
      // networks: JSON.stringify(networks),
      networks,
      uptime,
    });
  }
}

module.exports = System;
