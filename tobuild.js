import { execSync } from 'node:child_process';

// 封装执行函数，增加颜色打印方便观察
const run = command => {
  console.log(`\n> 执行命令: ${command}`);
  try {
    // stdio: 'inherit' 可以让命令执行过程中的日志直接输出到当前终端
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ 执行失败: ${command}`);
    process.exit(1); // 失败则停止后续操作
  }
};

const publish = () => {
  // 1. 执行构建
  console.log('📦 正在构建项目...');
  run('pnpm build');

  // 2. 切换到官方源
  console.log('🌐 切换至 npm 官方镜像源...');
  run('npm config set registry https://registry.npmjs.org/');

  // 3. 检查登录状态 (可选，防止未登录导致后面发布报错)
  // run('npm whoami');

  // 4. 更新版本号 (patch: 0.0.x)
  // 注意：如果你想通过参数控制 patch/minor/major，可以用 process.argv
  const type = ['patch', 'minor', 'major'][Number(process.argv[2]) || 0];
  console.log(`🏷️ 正在升级版本 [${type}]...`);
  run(`npm version ${type}`);

  // 5. 执行发布
  console.log('🚀 正在发布到 npm...');
  run('npm publish');

  // 6. 切回国内源
  console.log('🇨🇳 恢复国内镜像源...');
  run('npm config set registry https://registry.npmmirror.com/');

  console.log('\n✅ 发布完成！');
};

publish();
