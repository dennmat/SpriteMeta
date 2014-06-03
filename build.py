import os 
import subprocess

base_compile_path = 'c/'
for path, dirs, files in os.walk('src/'):
	for f in path:
		if not f.endswith('.js'):
			continue

		compiled_path = os.path.join(base_compile_path, f.split('src/')[1])

		subprocess.call(["node", "tools/compiletraceur.js", f, compiled_path])

subprocess.call(["nw.exe", "."])
