spritzup (Probably not the final name)
========

*0.1a - First version increase! Has super basic functionality*

A tool mainly for sectioning regions of a spritesheet into groups and individual sprites and exporting to a useable format.

Also there was a recent name change; screenshots/code has yet to catch up!

Technologies Used
------------------
1. [Node-Webkit](https://github.com/rogerwang/node-webkit). If you haven't checked it out yet, you should. It makes desktop development bearable by combining node.js and an embedded webkit allowing you to use HTML and CSS.
2. [Traceur](https://github.com/google/traceur-compiler). Yay ECMA6
3. (Sort of relevant here) Bootstrap, started with the Cover theme from their examples page.

### Apologies
Currently the mix of _ and camels is a little hectic, I'll get to cleaning up once I have this thing actually doing some useful stuff.

Dependencies
------------
Run these from the root directory so you end up with your `node_modules` folder there.

*Instead of the below setups* I recommend just running `npm install` from the root dir

Gulp - Build System
```bash
npm install gulp
```

Mustache - Template engine
```bash
npm install mustache
```

Traceur - ECMA 6 to ECMA 5 compiler
```bash
npm install traceur
```

Gulp-Sass - Build Sass
```bash
npm install gulp-sass
```

Gulp-Traceur - Build Traceur
```bash
npm install gulp-traceur
```

How To Build
------------
#### Windows/Linux

Make sure nodewebkit is on your path.

Get the dependencies.

Then from the root dir run:
```bash
gulp
```

Current Status
--------------

Getting the basic functions of the application implemented. Then onto code cleanup. Then onto "cool" feature development. Then onto bug fixes and feature creeps.

Screenshots
-----------
![First Screen](https://github.com/dennmat/spritzup/raw/master/screenshots/main-5-19-2014.png "Main Screen")
![Editor Screen](https://github.com/dennmat/spritzup/raw/master/screenshots/editor-6-15-2014.png "Editor Screen")
![Editor Screen Multi](https://github.com/dennmat/spritzup/raw/master/screenshots/editor-multiselect-6-16-2014.png "Editor Screen Multi Select")

### Super Early Animation Preview
Please note how early this feature is in dev. The preview is also blown up 500% right now. Will be dynamic later.

![Animations V -0.1](https://github.com/dennmat/spritzup/raw/master/screenshots/early-animations.gif "Animations Preview")
