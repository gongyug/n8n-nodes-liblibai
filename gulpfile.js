const { src, dest, parallel } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{png,svg}')
		.pipe(dest('dist/nodes/'));
}

function copyPackageFiles() {
	return src(['package.json', 'README.md'])
		.pipe(dest('dist/'));
}

// 导出任务
exports.build = parallel(buildIcons, copyPackageFiles);
exports['build:icons'] = buildIcons;
exports['copy:package'] = copyPackageFiles;