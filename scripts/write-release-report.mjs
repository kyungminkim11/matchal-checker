import fs from 'node:fs';
import path from 'node:path';

const auditDir=path.join(process.cwd(),'audit');
const jsonPath=path.join(auditDir,'latest-report.json');
const mdPath=path.join(auditDir,'latest-report.md');
const raw=fs.readFileSync(jsonPath,'utf8').trim();
const data=JSON.parse(raw);
const checks=Array.isArray(data.checks)?data.checks:[];
const failures=Array.isArray(data.failures)?data.failures:checks.filter(check=>check.pass===false);
const passed=checks.filter(check=>check.pass===true).length;
const decision=failures.length?'NO_GO':'GO';
const score=checks.length?Math.round(passed/checks.length*100):0;
const lines=[
  '# 맞팔체커 v12 출시 준비 보고서',
  '',
  `- 생성 시각: ${new Date().toISOString()}`,
  `- 커밋: ${process.env.GITHUB_SHA||'-'}`,
  `- 판정: **${decision}**`,
  `- 점수: **${score}/100**`,
  `- 통과: ${passed}/${checks.length}`,
  '',
  '## 검사 결과',
  '',
  ...checks.map(check=>`- ${check.pass?'✅':'❌'} ${check.name}`),
  '',
  '## 출시 차단 항목',
  '',
  ...(failures.length?failures.map(item=>`- ${item.name}`):['- 없음']),
  ''
];
fs.writeFileSync(mdPath,lines.join('\n'));
console.log(JSON.stringify({decision,score,passed,total:checks.length,failures:failures.length}));
if(failures.length) process.exitCode=1;
