/* */ 
var path = require('path');
var assert = require('assert');
var urix = require('../index');
"use stict";
function test(testPath, expected) {
  path.sep = "\\";
  assert.equal(urix(testPath), expected);
  path.sep = "/";
  assert.equal(urix(testPath), testPath);
}
describe("urix", function() {
  it("is a function", function() {
    assert.equal(typeof urix, "function");
  });
  it("converts backslashes to slashes", function() {
    test("a\\b\\c", "a/b/c");
    test("\\a\\b\\c", "/a/b/c");
    test("a/b\\c", "a/b/c");
    test("\\\\a\\\\\\b///c", "//a///b///c");
  });
  it("changes the drive letter to a slash", function() {
    test("c:\\a", "/a");
    test("C:\\a", "/a");
    test("z:\\a", "/a");
    test("c:a", "/a");
    test("c:/a", "/a");
    test("c:\\\\a", "//a");
    test("c://a", "//a");
    test("c:\\//a", "///a");
  });
});
