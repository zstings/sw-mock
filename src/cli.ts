#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 获取当前脚本的绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 获取用户输入的目录，默认为 'public'
const targetDir = process.argv[3] || 'public';
const targetPath = path.resolve(process.cwd(), targetDir);

// 2. 确定源码中 swMockWorker.js 的位置
// 假设你的 sw 文件在库的根目录或某个特定目录
const sourcePath = path.join(__dirname, '../public/swMockWorker.js');

console.log(sourcePath);

async function init() {
  try {
    // 检查目标目录是否存在，不存在则创建
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const destFile = path.join(targetPath, 'swMockWorker.js');

    // 3. 执行复制
    fs.copyFileSync(sourcePath, destFile);

    console.log(`\x1b[32m%s\x1b[0m`, `✔ 成功！已将 swMockWorker.js 复制到 ${targetDir}`);
    console.log(`\x1b[34m%s\x1b[0m`, `提示: 请确保 httpRequest.init() 调用结束。`);
  } catch (err: any) {
    console.error(`\x1b[31m%s\x1b[0m`, `错误: 无法创建文件，请检查权限或路径。`, err.message);
  }
}

init();
