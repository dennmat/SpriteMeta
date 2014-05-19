var traceur = require('traceur');
var fs = require('fs');

var contents = fs.readFileSync(process.argv[2]).toString();

var result = traceur.compile(contents, {
  filename: process.argv[2],
  sourceMap: true
});

if (result.errors.length)
 	console.log(result.errors);

fs.writeFileSync(process.argv[3], result.js);
fs.writeFileSync(process.argv[3]+'.map', result.sourceMap);