const fs = require('fs');
const filePath = 'd:/HK8/DATN/tn-da22ttc-kieugiathinh-bookstore-recommendation-mernstack/backend/services/emailService.js';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = "from: \\`\"BookBee Support\" <\\${process.env.EMAIL_USER}>\\`,";
const replacementStr = "from: `\"BookBee Support\" <${process.env.EMAIL_USER}>`,";

while (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
}

fs.writeFileSync(filePath, code);
console.log("Fix completed");
