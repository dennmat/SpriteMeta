import os 
import sys
import shutil
import zipfile
import subprocess

base_compile_path = 'c/'
for path, dirs, files in os.walk('src/'):
	for f in files:
		compiled_path = os.path.join(base_compile_path, os.path.join(path.split('src/')[1], f))

		if not os.path.exists(os.path.split(compiled_path)[0]):
			os.makedirs(os.path.split(compiled_path)[0])

		if f.endswith('.json'):
			shutil.copyfile(os.path.join(path, f), compiled_path)
			continue

		if not f.endswith('.js'):
			continue

		subprocess.call(["node", "tools/compiletraceur.js", os.path.join(path, f), compiled_path])

		print os.path.join(path, f), '--->', compiled_path

if len(sys.argv) == 1:
	subprocess.call(["nw.exe", "."])
else:
	required_files = [
		"icudt.dll",
		"nw.pak",
		"nw.exe"
	]

	if sys.argv[1] == 'full':
		try:
			os.makedirs('build/')
		except WindowsError:
			pass

		for f in required_files:
			shutil.copyfile(os.path.normpath(os.path.join('../', f)), os.path.join('build/', f))

		zipf = zipfile.ZipFile("build/spritzup.nw", 'w')

		for path, dirs, files in os.walk(os.getcwd()):
			if '\\src' in path or '\\tools' in path or '\\build' in path or '\\.git' in path or '\\screenshots' in path:
				continue

			try:
				clean_path = path.split('\\spriter\\')[1]
			except IndexError:
				clean_path = ''

			for _file in files:
				if _file.endswith('.py') or _file in ['README.md', '.gitignore']:
					continue
				zipf.write(os.path.join(clean_path, _file))
		zipf.close()

		subprocess.call(['copy', '/b', 'nw.exe+spritzup.nw', 'spritzup.exe'], shell=True, cwd=os.path.join(os.getcwd(), 'build/'))



