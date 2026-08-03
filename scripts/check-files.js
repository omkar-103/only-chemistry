const fs = require('fs');
const checks = [
  'src/types/index.ts',
  'src/lib/api/utils.ts',
  'src/lib/auth/jwt.ts',
  'src/app/api/exams/route.ts',
  'src/app/api/payments/create-order/route.ts',
  'src/app/api/payments/verify/route.ts',
  'src/app/dashboard/layout.tsx',
  'src/app/profile/page.tsx',
  'src/app/payments/page.tsx',
  'src/app/videos/page.tsx',
  'src/app/results/page.tsx',
  'src/app/results/[attemptId]/page.tsx',
  'src/app/doubts/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/page.tsx',
  'src/app/forgot-password/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/students/page.tsx',
  'src/app/admin/exams/page.tsx',
  'src/app/admin/exams/create/page.tsx',
  'src/app/admin/payments/page.tsx',
  'src/app/admin/doubts/page.tsx',
  'src/app/admin/videos/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/audit-logs/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/students/[id]/page.tsx',
];
checks.forEach(p => {
  const exists = fs.existsSync(p);
  const size = exists ? fs.statSync(p).size : 0;
  const status = !exists ? 'MISSING' : size < 100 ? 'EMPTY ' : 'OK    ';
  console.log(status, p.padEnd(55), size + 'b');
});
