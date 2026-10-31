const http = require('http');

const testAccounts = [
  { identifier: 'TNP-HEAD', password: 'TNP@Campus2026', role: 'STAFF' },
  { identifier: 'FINANCE-01', password: 'Finance@Campus2026', role: 'STAFF' },
  { identifier: 'LIB-001', password: 'Library@Campus2026', role: 'STAFF' },
  { identifier: 'FAC-001', password: 'Ashwini@FAC001', role: 'FACULTY' },
  { identifier: 'FAC-002', password: 'Varun@FAC002', role: 'FACULTY' },
  { identifier: 'FAC-003', password: 'Manasi@FAC003', role: 'FACULTY' },
  { identifier: '31001', password: 'Kavya@31001', role: 'STUDENT' },
  { identifier: '31002', password: 'Siddharth@31002', role: 'STUDENT' },
  { identifier: '31003', password: 'Om@31003', role: 'STUDENT' },
  { identifier: '31004', password: 'Rohan@31004', role: 'STUDENT' }
];

async function testLogin(account) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      identifier: account.identifier,
      password: account.password,
      role: account.role
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- Testing API Authentication for 10 Sample Accounts ---');
  for (const acc of testAccounts) {
    try {
      const res = await testLogin(acc);
      if (res.status === 200 && res.parsed?.token) {
        console.log(`✓ [SUCCESS] ${acc.identifier} (${acc.role}) authenticated successfully. User: ${res.parsed.user?.name || res.parsed.user?.student_name || res.parsed.user?.identifier}`);
      } else {
        console.log(`✗ [FAILED] ${acc.identifier} (${acc.role}) status: ${res.status}, response:`, res.parsed);
      }
    } catch (e) {
      console.log(`✗ [ERROR] ${acc.identifier}: ${e.message}`);
    }
  }
  process.exit(0);
}

run();
