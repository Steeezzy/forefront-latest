const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

function getFilesRecursively(dir, baseDir = dir) {
  const results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      
      if (file === 'node_modules' || file === '.git') {
        continue;
      }
      
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue; // skip unreadable files/links
      }
      
      if (stat && stat.isDirectory()) {
        results.push(...getFilesRecursively(fullPath, baseDir));
      } else {
        results.push(relPath);
      }
    }
  } catch (e) {}
  return results;
}

function compilePattern(pattern, isDefault = false) {
  pattern = pattern.trim();
  if (!pattern || pattern.startsWith('#')) return null;

  let negate = false;
  if (pattern.startsWith('!')) {
    negate = true;
    pattern = pattern.slice(1).trim();
  }

  // Handle trailing slash (means directory match)
  let isDirOnly = false;
  if (pattern.endsWith('/')) {
    isDirOnly = true;
    pattern = pattern.slice(0, -1);
  }

  // Convert glob to regex
  let regexStr = '';
  let i = 0;
  
  const startsWithSlash = pattern.startsWith('/');
  if (startsWithSlash) {
    pattern = pattern.slice(1);
  } else {
    if (!pattern.startsWith('**/')) {
      regexStr += '(?:^|.*/)';
    }
  }

  while (i < pattern.length) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') {
          regexStr += '(?:.*/)?';
          i += 3;
        } else {
          regexStr += '.*';
          i += 2;
        }
      } else {
        regexStr += '[^/]*';
        i += 1;
      }
    } else if (char === '?') {
      regexStr += '[^/]';
      i += 1;
    } else if (char === '.') {
      regexStr += '\\.';
      i += 1;
    } else if (char === '/') {
      regexStr += '/';
      i += 1;
    } else if ('+()^${}|[]\\'.includes(char)) {
      regexStr += '\\' + char;
      i += 1;
    } else {
      regexStr += char;
      i += 1;
    }
  }

  if (isDirOnly) {
    regexStr += '(?:$|/.*)';
  } else {
    regexStr += '(?:$|/.*)';
  }

  return {
    negate,
    raw: pattern,
    regex: new RegExp('^' + regexStr + '$'),
    isDefault
  };
}

function compileIgnoreFile(content, isDefault = false) {
  const lines = content.split('\n');
  const rules = [];
  for (let line of lines) {
    const rule = compilePattern(line, isDefault);
    if (rule) rules.push(rule);
  }
  return rules;
}

const extensionToLanguage = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.php': 'php',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.sh': 'shell',
  '.bash': 'shell',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  '.md': 'markdown',
  '.rst': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.json': 'json',
  '.jsonc': 'jsonc',
  '.toml': 'toml',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.tf': 'terraform',
  '.tfvars': 'terraform',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.less': 'css',
  '.xml': 'xml',
  '.cfg': 'config',
  '.ini': 'config',
  '.env': 'config'
};

function getLanguage(filePath) {
  const fileName = path.basename(filePath);
  if (fileName === 'Dockerfile') return 'dockerfile';
  if (fileName === 'Makefile') return 'makefile';
  if (fileName === 'Jenkinsfile') return 'jenkinsfile';
  
  const ext = path.extname(filePath).toLowerCase();
  if (extensionToLanguage[ext]) return extensionToLanguage[ext];
  if (ext) return ext.slice(1);
  return 'unknown';
}

function getFileCategory(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  // 1. docs
  if ((ext === '.md' || ext === '.rst' || ext === '.txt') && fileName !== 'LICENSE') {
    return 'docs';
  }
  
  // 2. infra
  if (
    fileName === 'Dockerfile' ||
    fileName === 'Makefile' ||
    fileName === 'Jenkinsfile' ||
    fileName === 'Procfile' ||
    fileName === 'Vagrantfile' ||
    fileName.startsWith('docker-compose.') ||
    ext === '.tf' ||
    ext === '.tfvars' ||
    filePath.includes('.github/workflows/') ||
    fileName === '.gitlab-ci.yml' ||
    filePath.includes('.circleci/') ||
    fileName.endsWith('.k8s.yaml') ||
    fileName.endsWith('.k8s.yml') ||
    filePath.split('/').includes('k8s') ||
    filePath.split('/').includes('kubernetes')
  ) {
    return 'infra';
  }
  
  // 3. data
  if (
    ext === '.sql' ||
    ext === '.graphql' ||
    ext === '.gql' ||
    ext === '.proto' ||
    ext === '.prisma' ||
    ext === '.csv' ||
    fileName.endsWith('.schema.json')
  ) {
    return 'data';
  }
  
  // 4. config
  const configExtensions = ['.yaml', '.yml', '.json', '.jsonc', '.toml', '.xml', '.cfg', '.ini', '.env'];
  const configFiles = ['tsconfig.json', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod'];
  if (configExtensions.includes(ext) || configFiles.includes(fileName)) {
    return 'config';
  }
  
  // 5. script
  if (ext === '.sh' || ext === '.bash' || ext === '.ps1' || ext === '.bat') {
    return 'script';
  }
  
  // 6. markup
  if (ext === '.html' || ext === '.htm' || ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') {
    return 'markup';
  }
  
  // 7. code (default)
  return 'code';
}

function countLinesOfFiles(filePaths, projectRoot) {
  const lineCounts = {};
  const batchSize = 100;
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const chunk = filePaths.slice(i, i + batchSize);
    const escapedPaths = chunk.map(p => `"${path.join(projectRoot, p).replace(/"/g, '\\"')}"`).join(' ');
    try {
      const output = child_process.execSync(`wc -l ${escapedPaths}`, { maxBuffer: 1024 * 1024 * 10 }).toString();
      const lines = output.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.match(/^(\d+)\s+(.+)$/);
        if (parts) {
          const count = parseInt(parts[1], 10);
          const fullPath = parts[2];
          const relPath = path.relative(projectRoot, fullPath);
          if (chunk.includes(relPath)) {
            lineCounts[relPath] = count;
          }
        }
      }
    } catch (err) {
      for (const relPath of chunk) {
        try {
          const content = fs.readFileSync(path.join(projectRoot, relPath), 'utf8');
          lineCounts[relPath] = content.split('\n').length;
        } catch (e) {
          lineCounts[relPath] = 0;
        }
      }
    }
  }
  return lineCounts;
}

const frameworkMap = {
  'react': 'React',
  'vue': 'Vue',
  'svelte': 'Svelte',
  '@angular/core': 'Angular',
  'express': 'Express',
  'fastify': 'Fastify',
  'koa': 'Koa',
  'next': 'Next.js',
  'nuxt': 'Nuxt.js',
  'vite': 'Vite',
  'vitest': 'Vitest',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'tailwindcss': 'Tailwind CSS',
  'prisma': 'Prisma',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'mongoose': 'Mongoose',
  'redux': 'Redux',
  'zustand': 'Zustand',
  'mobx': 'MobX'
};

const pythonFrameworkMap = {
  'django': 'Django',
  'djangorestframework': 'Django REST Framework',
  'fastapi': 'FastAPI',
  'flask': 'Flask',
  'sqlalchemy': 'SQLAlchemy',
  'alembic': 'Alembic',
  'celery': 'Celery',
  'pydantic': 'Pydantic',
  'uvicorn': 'Uvicorn',
  'gunicorn': 'Gunicorn',
  'aiohttp': 'aiohttp',
  'tornado': 'Tornado',
  'starlette': 'Starlette',
  'pytest': 'Pytest',
  'hypothesis': 'Hypothesis',
  'channels': 'Django Channels'
};

const rubyFrameworkMap = {
  'rails': 'Ruby on Rails',
  'railties': 'Ruby on Rails',
  'sinatra': 'Sinatra',
  'grape': 'Grape',
  'rspec': 'RSpec',
  'sidekiq': 'Sidekiq',
  'activerecord': 'ActiveRecord',
  'actionpack': 'ActionPack',
  'devise': 'Devise',
  'pundit': 'Pundit'
};

const goFrameworkMap = {
  'github.com/gin-gonic/gin': 'Gin',
  'github.com/labstack/echo': 'Echo',
  'github.com/gofiber/fiber': 'Fiber',
  'github.com/go-chi/chi': 'Chi',
  'gorm.io/gorm': 'GORM'
};

const rustFrameworkMap = {
  'actix-web': 'Actix Web',
  'axum': 'Axum',
  'rocket': 'Rocket',
  'diesel': 'Diesel',
  'tokio': 'Tokio',
  'serde': 'Serde',
  'warp': 'Warp'
};

const jvmFrameworkMap = {
  'spring-boot': 'Spring Boot',
  'spring-web': 'Spring Framework',
  'spring-data': 'Spring Data',
  'quarkus': 'Quarkus',
  'micronaut': 'Micronaut',
  'hibernate': 'Hibernate',
  'jakarta': 'Jakarta EE',
  'junit': 'JUnit',
  'ktor': 'Ktor'
};

function detectFrameworks(discoveredFiles, projectRoot) {
  const frameworks = new Set();
  const hasFile = (name) => discoveredFiles.some(f => f.path === name);
  
  if (hasFile('tsconfig.json')) {
    frameworks.add('TypeScript');
  }
  if (hasFile('Dockerfile')) {
    frameworks.add('Docker');
  }
  if (hasFile('docker-compose.yml') || hasFile('docker-compose.yaml')) {
    frameworks.add('Docker Compose');
  }
  if (discoveredFiles.some(f => path.extname(f.path) === '.tf')) {
    frameworks.add('Terraform');
  }
  if (discoveredFiles.some(f => f.path.startsWith('.github/workflows/'))) {
    frameworks.add('GitHub Actions');
  }
  if (hasFile('.gitlab-ci.yml')) {
    frameworks.add('GitLab CI');
  }
  if (hasFile('Jenkinsfile')) {
    frameworks.add('Jenkins');
  }
  
  if (hasFile('package.json')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
      const pkg = JSON.parse(content);
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const [dep, ver] of Object.entries(allDeps)) {
        if (frameworkMap[dep]) {
          frameworks.add(frameworkMap[dep]);
        }
      }
    } catch (e) {}
  }
  
  if (hasFile('Cargo.toml')) {
    frameworks.add('Rust');
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'Cargo.toml'), 'utf8');
      const lines = content.split('\n');
      let inDeps = false;
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('[dependencies]')) {
          inDeps = true;
          continue;
        }
        if (line.startsWith('[')) {
          inDeps = false;
        }
        if (inDeps && line && !line.startsWith('#')) {
          const parts = line.split('=');
          if (parts[0]) {
            const crate = parts[0].trim();
            if (rustFrameworkMap[crate]) {
              frameworks.add(rustFrameworkMap[crate]);
            }
          }
        }
      }
    } catch (e) {}
  }
  
  if (hasFile('go.mod')) {
    frameworks.add('Go');
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'go.mod'), 'utf8');
      const lines = content.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('require')) {
          for (const [mod, name] of Object.entries(goFrameworkMap)) {
            if (line.includes(mod)) {
              frameworks.add(name);
            }
          }
        }
      }
    } catch (e) {}
  }

  if (hasFile('requirements.txt')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'requirements.txt'), 'utf8');
      const lines = content.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const name = line.split(/[=>~<]/)[0].trim().toLowerCase();
        if (pythonFrameworkMap[name]) {
          frameworks.add(pythonFrameworkMap[name]);
        }
      }
    } catch (e) {}
  }

  if (hasFile('pyproject.toml')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'pyproject.toml'), 'utf8');
      if (content.includes('[tool.pytest.ini_options]')) frameworks.add('Pytest');
      if (content.includes('[tool.django]')) frameworks.add('Django');
      
      const lines = content.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        for (const [pkg, name] of Object.entries(pythonFrameworkMap)) {
          if (line.toLowerCase().includes(pkg)) {
            frameworks.add(name);
          }
        }
      }
    } catch (e) {}
  }

  if (hasFile('Gemfile')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'Gemfile'), 'utf8');
      const lines = content.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('gem ')) {
          const match = line.match(/gem\s+['"]([^'"]+)['"]/);
          if (match && match[1]) {
            const gem = match[1].toLowerCase();
            if (rubyFrameworkMap[gem]) {
              frameworks.add(rubyFrameworkMap[gem]);
            }
          }
        }
      }
    } catch (e) {}
  }

  const jvmFiles = ['pom.xml', 'build.gradle', 'build.gradle.kts'];
  for (const jvmFile of jvmFiles) {
    if (hasFile(jvmFile)) {
      try {
        const content = fs.readFileSync(path.join(projectRoot, jvmFile), 'utf8');
        for (const [dep, name] of Object.entries(jvmFrameworkMap)) {
          if (content.includes(dep)) {
            frameworks.add(name);
          }
        }
      } catch (e) {}
    }
  }

  return Array.from(frameworks).sort();
}

function getProjectName(discoveredFiles, projectRoot) {
  const hasFile = (name) => discoveredFiles.some(f => f.path === name);
  
  if (hasFile('package.json')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
      const name = JSON.parse(content).name;
      if (name) return name;
    } catch (e) {}
  }
  
  if (hasFile('Cargo.toml')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'Cargo.toml'), 'utf8');
      const match = content.match(/name\s*=\s*['"]([^'"]+)['"]/);
      if (match && match[1]) return match[1];
    } catch (e) {}
  }
  
  if (hasFile('go.mod')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'go.mod'), 'utf8');
      const lines = content.split('\n');
      if (lines[0] && lines[0].startsWith('module ')) {
        const parts = lines[0].split(' ');
        if (parts[1]) {
          const modPath = parts[1].trim();
          const segments = modPath.split('/');
          return segments[segments.length - 1];
        }
      }
    } catch (e) {}
  }
  
  if (hasFile('pyproject.toml')) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'pyproject.toml'), 'utf8');
      const nameMatch = content.match(/\[project\][^]*?name\s*=\s*['"]([^'"]+)['"]/);
      if (nameMatch && nameMatch[1]) return nameMatch[1];
      const poetryMatch = content.match(/\[tool\.poetry\][^]*?name\s*=\s*['"]([^'"]+)['"]/);
      if (poetryMatch && poetryMatch[1]) return poetryMatch[1];
    } catch (e) {}
  }
  
  return path.basename(projectRoot);
}

const extensionProbes = [
  '',
  '.ts', '.tsx', '.js', '.jsx',
  '/index.ts', '/index.js', '/index.tsx', '/index.jsx',
  '.py', '.go', '.rs', '.rb'
];

function probeImport(targetPath, importingFileDir, discoveredPathsSet, projectRoot) {
  let isProjectRelative = true;
  let resolvedPath = targetPath;
  
  if (targetPath.startsWith('.') || targetPath.startsWith('..')) {
    isProjectRelative = false;
    resolvedPath = path.join(importingFileDir, targetPath);
  }

  const relPath = isProjectRelative ? path.normalize(resolvedPath) : path.relative(projectRoot, resolvedPath);

  for (const ext of extensionProbes) {
    const probed = relPath + ext;
    const normalizedProbed = path.normalize(probed).replace(/\\/g, '/');
    if (discoveredPathsSet.has(normalizedProbed)) {
      return normalizedProbed;
    }
  }
  return null;
}

const pyFromImportRegex = /^\s*from\s+([\w.]+)\s+import\s+([\w\s,()]+)/gm;
const pyImportRegex = /^\s*import\s+([\w.,\s]+)/gm;

function resolvePythonImport(content, importingFile, discoveredPathsSet) {
  const results = [];
  const dir = path.dirname(importingFile);

  let match;
  pyFromImportRegex.lastIndex = 0;
  while ((match = pyFromImportRegex.exec(content)) !== null) {
    const modulePathStr = match[1];
    const importedNamesStr = match[2];
    const names = importedNamesStr.replace(/[()]/g, '').split(',').map(n => n.trim());

    let baseDir = dir;
    let modulePath = modulePathStr;

    if (modulePathStr.startsWith('.')) {
      let dotsCount = 0;
      while (modulePathStr[dotsCount] === '.') {
        dotsCount++;
      }
      for (let k = 1; k < dotsCount; k++) {
        baseDir = path.dirname(baseDir);
      }
      modulePath = modulePathStr.slice(dotsCount);
    }

    const moduleSubPath = modulePath ? modulePath.replace(/\./g, '/') : '';
    let resolvedBase = modulePathStr.startsWith('.') ? path.join(baseDir, moduleSubPath) : moduleSubPath;
    
    let matchedModuleFile = null;
    let matchedAsInit = false;

    if (resolvedBase) {
      const path1 = path.normalize(resolvedBase + '.py').replace(/\\/g, '/');
      const path2 = path.normalize(resolvedBase + '/__init__.py').replace(/\\/g, '/');

      if (discoveredPathsSet.has(path1)) {
        matchedModuleFile = path1;
      } else if (discoveredPathsSet.has(path2)) {
        matchedModuleFile = path2;
        matchedAsInit = true;
      }
    } else {
      const pathInit = path.normalize(dir + '/__init__.py').replace(/\\/g, '/');
      if (discoveredPathsSet.has(pathInit)) {
        matchedModuleFile = pathInit;
        matchedAsInit = true;
      } else {
        matchedAsInit = true;
      }
    }

    if (matchedModuleFile) {
      results.push(matchedModuleFile);
    }

    if (matchedAsInit || !resolvedBase) {
      const searchDir = resolvedBase ? resolvedBase : dir;
      for (const name of names) {
        const subPath1 = path.normalize(searchDir + '/' + name + '.py').replace(/\\/g, '/');
        const subPath2 = path.normalize(searchDir + '/' + name + '/__init__.py').replace(/\\/g, '/');
        if (discoveredPathsSet.has(subPath1)) {
          results.push(subPath1);
        } else if (discoveredPathsSet.has(subPath2)) {
          results.push(subPath2);
        }
      }
    }
  }

  pyImportRegex.lastIndex = 0;
  while ((match = pyImportRegex.exec(content)) !== null) {
    const importsStr = match[1];
    const parts = importsStr.split(',');
    for (let part of parts) {
      part = part.trim().split(/\s+as\s+/)[0].trim();
      const moduleSubPath = part.replace(/\./g, '/');
      const path1 = path.normalize(moduleSubPath + '.py').replace(/\\/g, '/');
      const path2 = path.normalize(moduleSubPath + '/__init__.py').replace(/\\/g, '/');

      if (discoveredPathsSet.has(path1)) {
        results.push(path1);
      } else if (discoveredPathsSet.has(path2)) {
        results.push(path2);
      }
    }
  }

  return results;
}

function resolveImports(discoveredFiles, projectRoot) {
  const discoveredPaths = discoveredFiles.map(f => f.path);
  const discoveredPathsSet = new Set(discoveredPaths);
  const importMap = {};
  
  let pathAliases = {};
  let baseUrl = '.';
  const hasTsconfig = discoveredPaths.includes('tsconfig.json');
  if (hasTsconfig) {
    try {
      const tsconfigContent = fs.readFileSync(path.join(projectRoot, 'tsconfig.json'), 'utf8');
      const cleanedJson = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      const tsconfig = JSON.parse(cleanedJson);
      if (tsconfig.compilerOptions) {
        if (tsconfig.compilerOptions.baseUrl) {
          baseUrl = tsconfig.compilerOptions.baseUrl;
        }
        if (tsconfig.compilerOptions.paths) {
          pathAliases = tsconfig.compilerOptions.paths;
        }
      }
    } catch (e) {}
  }

  function resolvePathAlias(importPath) {
    for (const [aliasPattern, targetPatterns] of Object.entries(pathAliases)) {
      const regexPattern = aliasPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace('\\*', '(.*)');
      const match = importPath.match(new RegExp('^' + regexPattern + '$'));
      if (match) {
        const wildcardValue = match[1] || '';
        for (const targetPattern of targetPatterns) {
          const resolvedTarget = targetPattern.replace('*', wildcardValue);
          return path.join(baseUrl, resolvedTarget);
        }
      }
    }
    return null;
  }

  let goModulePath = '';
  const hasGoMod = discoveredPaths.includes('go.mod');
  if (hasGoMod) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'go.mod'), 'utf8');
      const lines = content.split('\n');
      if (lines[0] && lines[0].startsWith('module ')) {
        goModulePath = lines[0].split(' ')[1].trim();
      }
    } catch (e) {}
  }

  let psr4Map = {};
  const hasComposer = discoveredPaths.includes('composer.json');
  if (hasComposer) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'composer.json'), 'utf8');
      const composer = JSON.parse(content);
      if (composer.autoload && composer.autoload['psr-4']) {
        psr4Map = composer.autoload['psr-4'];
      }
    } catch (e) {}
  }

  for (const file of discoveredFiles) {
    importMap[file.path] = [];
    
    if (file.fileCategory !== 'code') {
      continue;
    }
    
    try {
      const content = fs.readFileSync(path.join(projectRoot, file.path), 'utf8');
      const imports = new Set();
      const importingFileDir = path.dirname(file.path);
      
      if (file.language === 'typescript' || file.language === 'javascript') {
        const importRegex = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const target = match[1];
          const aliased = resolvePathAlias(target);
          const probed = probeImport(aliased || target, importingFileDir, discoveredPathsSet, projectRoot);
          if (probed && probed !== file.path) imports.add(probed);
        }
        
        while ((match = requireRegex.exec(content)) !== null) {
          const target = match[1];
          const aliased = resolvePathAlias(target);
          const probed = probeImport(aliased || target, importingFileDir, discoveredPathsSet, projectRoot);
          if (probed && probed !== file.path) imports.add(probed);
        }
      }
      
      else if (file.language === 'python') {
        const pyImports = resolvePythonImport(content, file.path, discoveredPathsSet);
        for (const p of pyImports) {
          if (p !== file.path) imports.add(p);
        }
      }
      
      else if (file.language === 'go' && goModulePath) {
        const goImportRegex = /"([^"]+)"/g;
        let match;
        while ((match = goImportRegex.exec(content)) !== null) {
          const target = match[1];
          if (target.startsWith(goModulePath)) {
            const relSub = target.slice(goModulePath.length).replace(/^\//, '');
            for (const dp of discoveredPaths) {
              if (dp.startsWith(relSub) && dp.endsWith('.go') && dp !== file.path) {
                imports.add(dp);
              }
            }
          }
        }
      }
      
      else if (file.language === 'rust') {
        const rustModRegex = /mod\s+(\w+);/g;
        let match;
        while ((match = rustModRegex.exec(content)) !== null) {
          const modName = match[1];
          const probe1 = path.normalize(path.join(importingFileDir, modName + '.rs')).replace(/\\/g, '/');
          const probe2 = path.normalize(path.join(importingFileDir, modName, 'mod.rs')).replace(/\\/g, '/');
          if (discoveredPathsSet.has(probe1) && probe1 !== file.path) imports.add(probe1);
          if (discoveredPathsSet.has(probe2) && probe2 !== file.path) imports.add(probe2);
        }
      }
      
      else if (file.language === 'java' || file.language === 'kotlin') {
        const jvmImportRegex = /import\s+([\w.]+);?/g;
        let match;
        const fileExt = file.language === 'java' ? '.java' : '.kt';
        while ((match = jvmImportRegex.exec(content)) !== null) {
          const importStr = match[1];
          const relPathPart = importStr.replace(/\./g, '/') + fileExt;
          for (const dp of discoveredPaths) {
            if (dp.endsWith(relPathPart) && dp !== file.path) {
              imports.add(dp);
            }
          }
        }
      }
      
      else if (file.language === 'ruby') {
        const rubyRequireRegex = /(?:require|require_relative)\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = rubyRequireRegex.exec(content)) !== null) {
          const target = match[1];
          const probed = probeImport(target, importingFileDir, discoveredPathsSet, projectRoot);
          if (probed && probed !== file.path) {
            imports.add(probed);
          } else {
            const loadPaths = [`lib/${target}.rb`, `app/${target}.rb`, `${target}.rb`].map(p => path.normalize(p).replace(/\\/g, '/'));
            for (const lp of loadPaths) {
              if (discoveredPathsSet.has(lp) && lp !== file.path) {
                imports.add(lp);
                break;
              }
            }
          }
        }
      }
      
      else if (file.language === 'php') {
        const phpUseRegex = /use\s+([\w\\]+);/g;
        let match;
        while ((match = phpUseRegex.exec(content)) !== null) {
          const nsClass = match[1];
          for (const [prefix, dirMapping] of Object.entries(psr4Map)) {
            if (nsClass.startsWith(prefix)) {
              const suffix = nsClass.slice(prefix.length).replace(/\\/g, '/');
              const resolved = path.normalize(path.join(dirMapping, suffix + '.php')).replace(/\\/g, '/');
              if (discoveredPathsSet.has(resolved) && resolved !== file.path) {
                imports.add(resolved);
              }
            }
          }
        }
      }
      
      else if (file.language === 'cpp' || file.language === 'c') {
        const cIncludeRegex = /#include\s+['"<]([^'">]+)['">]/g;
        let match;
        while ((match = cIncludeRegex.exec(content)) !== null) {
          const target = match[1];
          const probed = probeImport(target, importingFileDir, discoveredPathsSet, projectRoot);
          if (probed && probed !== file.path) {
            imports.add(probed);
          } else {
            const probes = [`include/${target}`, `src/${target}`, target].map(p => path.normalize(p).replace(/\\/g, '/'));
            for (const p of probes) {
              if (discoveredPathsSet.has(p) && p !== file.path) {
                imports.add(p);
                break;
              }
            }
          }
        }
      }
      
      importMap[file.path] = Array.from(imports).sort();
    } catch (e) {
      importMap[file.path] = [];
    }
  }
  
  return importMap;
}

function main() {
  const projectRoot = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!projectRoot || !outputPath) {
    console.error('Usage: node ua-project-scan.js <projectRoot> <outputPath>');
    process.exit(1);
  }
  
  if (!fs.existsSync(projectRoot)) {
    console.error(`Project root directory does not exist: ${projectRoot}`);
    process.exit(1);
  }
  
  let gitFiles = [];
  try {
    const output = child_process.execSync('git ls-files', { cwd: projectRoot, maxBuffer: 1024 * 1024 * 50 }).toString();
    gitFiles = output.split('\n').map(f => f.trim()).filter(Boolean);
  } catch (e) {
    gitFiles = getFilesRecursively(projectRoot);
  }
  
  const defaultRulesContent = `
node_modules/
.git/
vendor/
venv/
.venv/
__pycache__/
dist/
build/
out/
coverage/
.next/
.cache/
.turbo/
target/
obj/
*.lock
package-lock.json
yarn.lock
pnpm-lock.yaml
bun.lock
*.png
*.jpg
*.jpeg
*.gif
*.svg
*.ico
*.woff
*.woff2
*.ttf
*.eot
*.mp3
*.mp4
*.pdf
*.zip
*.tar
*.gz
*.min.js
*.min.css
*.map
*.generated.*
.idea/
.vscode/
LICENSE
.gitignore
.editorconfig
.prettierrc
.eslintrc*
*.log
`;

  const rules = [];
  rules.push(...compileIgnoreFile(defaultRulesContent, true));

  let rootIgnoreContent = '';
  try {
    rootIgnoreContent = fs.readFileSync(path.join(projectRoot, '.understandignore'), 'utf8');
  } catch (e) {}

  let uaIgnoreContent = '';
  try {
    uaIgnoreContent = fs.readFileSync(path.join(projectRoot, '.understand-anything', '.understandignore'), 'utf8');
  } catch (e) {}

  if (rootIgnoreContent) {
    rules.push(...compileIgnoreFile(rootIgnoreContent, false));
  }
  if (uaIgnoreContent) {
    rules.push(...compileIgnoreFile(uaIgnoreContent, false));
  }

  function checkIgnored(filePath, checkRules) {
    let ignored = false;
    let lastRule = null;
    for (const rule of checkRules) {
      if (rule.regex.test(filePath)) {
        ignored = !rule.negate;
        lastRule = rule;
      }
    }
    return { ignored, lastRule };
  }

  let filteredByIgnore = 0;
  const finalFilesList = [];
  
  for (const file of gitFiles) {
    const normFile = file.replace(/\\/g, '/');
    const defaultCheck = checkIgnored(normFile, rules.filter(r => r.isDefault));
    const unifiedCheck = checkIgnored(normFile, rules);
    
    if (unifiedCheck.ignored) {
      if (!defaultCheck.ignored) {
        filteredByIgnore++;
      }
    } else {
      finalFilesList.push(normFile);
    }
  }

  const filesArray = finalFilesList.map(filePath => {
    return {
      path: filePath,
      language: getLanguage(filePath),
      fileCategory: getFileCategory(filePath)
    };
  });

  const allFilePaths = filesArray.map(f => f.path);
  const lineCounts = countLinesOfFiles(allFilePaths, projectRoot);
  
  for (const f of filesArray) {
    f.sizeLines = lineCounts[f.path] || 0;
  }

  // Sort files by path alphabetically
  filesArray.sort((a, b) => a.path.localeCompare(b.path));

  const totalFiles = filesArray.length;
  
  // Complexity estimation
  let estimatedComplexity = 'small';
  if (totalFiles > 500) estimatedComplexity = 'very-large';
  else if (totalFiles > 150) estimatedComplexity = 'large';
  else if (totalFiles > 30) estimatedComplexity = 'moderate';

  const name = getProjectName(filesArray, projectRoot);
  
  let rawDescription = '';
  if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    try {
      const content = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
      rawDescription = JSON.parse(content).description || '';
    } catch (e) {}
  }
  
  let readmeHead = '';
  if (fs.existsSync(path.join(projectRoot, 'README.md'))) {
    try {
      const readmeContent = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
      readmeHead = readmeContent.split('\n').slice(0, 10).join('\n');
    } catch (e) {}
  }

  // Detect languages present in the files
  const languagesSet = new Set(filesArray.map(f => f.language));
  const languages = Array.from(languagesSet).sort();

  // Framework detection
  const frameworks = detectFrameworks(filesArray, projectRoot);

  // Import map
  const importMap = resolveImports(filesArray, projectRoot);

  const results = {
    scriptCompleted: true,
    name,
    rawDescription,
    readmeHead,
    languages,
    frameworks,
    files: filesArray,
    totalFiles,
    filteredByIgnore,
    estimatedComplexity,
    importMap
  };

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Project scan completed successfully.');
  process.exit(0);
}

main();
