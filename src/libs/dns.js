const dns = require('node:dns');

// TODO: DNS WILL BE A PART OF IDENTITY MODULE
class DNS {
 getDomainInfo(domain) {
  var options = {
   family: 4,
   hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };
  var result = '';
  dns.lookup(domain, options, (err, address, family) => res = 'address: ' + address + ', family: IPv' + family);
  options.all = true; // When options.all is true, the result will be an Array.
  dns.lookup(domain, options, (err, addresses) => res += 'addresses: ' + addresses);
  return result;
 } 
}

module.exports = DNS;
