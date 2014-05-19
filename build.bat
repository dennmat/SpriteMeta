@echo off

for %%f in (src/*.js) do (
	node tools/compiletraceur.js src/%%f c/%%f
)

E:\sct\Tools\nw\nw.exe E:\sct\Tools\nw\spriter\