spritzup
========

A tool mainly for sectioning regions of a spritesheet into groups and individual sprites and exporting to a useable format.

Also there was a recent name change screenshots/code has yet to catch up!

Techonologies Used
------------------
1. [Node-Webkit](https://github.com/rogerwang/node-webkit). If you haven't checked it out yet you should. It makes desktop development bearable by combining nodejs and an embedded webkit allowing you to use html and css.
2. [Traceur](https://github.com/google/traceur-compiler). Yay ecma6
3.(Sort of relevant here) Bootstrap, started with the Cover theme from their examples page.

### Apologies
Currently the mix of _ and camels is a little hectic I'll get to cleaning up once I have this thing actually doing some useful stuff.

Dependencies
------------
Run these from the root directory so you end up with your `node_modules` folder there.

Mustache - Template engine
```bash
npm install mustache
```

traceur - ECMA 6 to ECMA 5 compiler
```bash
npm install traceur
```

How To Build
------------

*Windows* - assuming you have nodewebkit first get the dependencies then just run build.bat
*Linux* - no build script yet, however shouldn't be hard to make can reuse node script for compiling traceur.

>*Note:* traceur builds into a directory 'c/' in the root of the project. Use these in requires. 

Current Status
--------------

Working on:

* Implementing the group/sprite selection tools/functionality.
* Implementing a method of scaling the selections with the editor.
* Grid selection, will build a grid of specified dimensions and create sprites out of the cells.
* Auto size group. Sizing one cell, will create equivalent cells throughout the group automatically.
* Proper saving/export.


Screenshots
-----------
![First Screen](https://github.com/dennmat/spritzup/raw/master/screenshots/main-5-19-2014.png "Main Screen")
![Editor Screen](https://github.com/dennmat/spritzup/raw/master/screenshots/editor-5-19-2014.png "Editor Screen")
