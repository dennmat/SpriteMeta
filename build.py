import os 
import shutil
import subprocess

base_compile_path = 'c/'
for path, dirs, files in os.walk('src/'):
	for f in files:
		compiled_path = os.path.join(base_compile_path, os.path.join(path.split('src/')[1], f))

		if not os.path.exists(os.path.split(compiled_path)[1]):
			os.makedirs(os.path.split(compiled_path)[1])

		if f.endswith('.json'):
			shutil.copyfile(os.path.join(path, f), compiled_path)
			continue

		if not f.endswith('.js'):
			continue

		subprocess.call(["node", "tools/compiletraceur.js", os.path.join(path, f), compiled_path])

		print os.path.join(path, f), '--->', compiled_path

subprocess.call(["nw.exe", "."])
