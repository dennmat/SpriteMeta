@echo off

for %%f in (src/*.js) do (
	node tools/compiletraceur.js src/%%f c/%%f
)

nw.exe .