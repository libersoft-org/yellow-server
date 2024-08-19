import dns from 'dns/promises';

class DNS {
 async getAllDnsRecords(domain) {
  try {
   const records = await dns.resolveAny(domain);
   console.log('DNS Records:', records);
  } catch (err) {
   console.error('Error:', err);
  }
 }

 async getSpecificDnsRecords(domain) {
  try {
   const aRecords = await dns.resolve4(domain);
   console.log('A Records:', aRecords);
   const mxRecords = await dns.resolveMx(domain);
   console.log('MX Records:', mxRecords);
   const txtRecords = await dns.resolveTxt(domain);
   console.log('TXT Records:', txtRecords);
  } catch (err) {
   console.error('Error:', err);
  }
 }
}

module.exports = DNS;
