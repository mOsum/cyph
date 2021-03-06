/* */ 
var fs = require('fs');
var template = fs.readFileSync("source-map-resolve.js.template").toString();
var nodeCode = fs.readFileSync("lib/source-map-resolve-node.js").toString();
nodeCode = nodeCode.replace(/^\s*(?:\/\/.+\s+|var\s+\w+\s*=\s*require\([^)]+\).*\s+)*/, "").replace(/(\w+)\s*=\s*urix\(\1\)\s*/g, "").replace(/module\.exports = (\{[^}]+\})\s*$/, "return $1").replace(/^(?!$)/gm, "  ");
var code = template.replace(/[ \t]*\{\{source-map-resolve-node.js\}\}/, nodeCode);
fs.writeFileSync("source-map-resolve.js", code);
