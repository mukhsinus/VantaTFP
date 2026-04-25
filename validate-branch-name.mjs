const branchName = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';

if (!branchName) {
  process.exit(0);
}

const protectedBranches = new Set(['main', 'master', 'develop']);
if (protectedBranches.has(branchName)) {
  process.exit(0);
}

const allowed = /^(feature|bugfix|hotfix|chore|refactor|docs|test)\/[a-z0-9._-]+$/;

if (!allowed.test(branchName)) {
  console.error(
    `Invalid branch name "${branchName}". Use "<type>/<slug>" where type is feature|bugfix|hotfix|chore|refactor|docs|test.`
  );
  process.exit(1);
}
