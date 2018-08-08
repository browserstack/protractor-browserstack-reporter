var path = require('path'),
  fs = require('fs'),
  mkdirp = require('mkdirp');
var BrowserStackReporter = {
  name: "browserstack-protractor-plugin",
  
  teardown: function(){

    function onSingleFileOutput (sessionID) {
      const xml = prepareXml(sessionID)
      let filename = `WDIO.xunit.all.xml` // default
      write(filename, xml)
    }

    function prepareName(name = 'Skipped test') {
      return name.split(/[^a-zA-Z0-9]+/).filter(
        (item) => item && item.length
      ).join('_')
    }

    function prepareXml(sessionID){
      var xmlbuilder = require('xmlbuilder');
      const builder = xmlbuilder.create('testsuites', {encoding: 'UTF-8', allowSurrogateChars: true})
      const packageName = "packageName"
      // TODO suitname
      const suiteName = prepareName("suitetitle")
      const testSuite = builder.ele("testsuite", {name: suiteName})
      // TODO testname
      const testName = prepareName("testname")
      const testCase = testSuite.ele("testcase",{className: `${packageName}.${suiteName}`, name: testName });
      testCase.ele("session", {}, sessionID);
      return builder.end({ pretty: true});
    }

    function write(filename, xml) {
      var outputDir = "target/browserstack-reports"
      try {
        const dir = path.resolve(outputDir)
        const filepath = path.join(dir, filename)
        mkdirp.sync(dir)
        fs.writeFileSync(filepath, xml)
        console.log(`Wrote xunit report "${filename}" to [${outputDir}].`)
      } catch (e) {
        console.log(`Failed to write xunit report "${filename}"
         to [${outputDir}]. Error: ${e}`)
      }
    }

    function format (val) {
      return JSON.stringify(baseReporter.limit(val))
    }

    console.log("wowowow teardown")
    browser.getSession().then(function(session) {
      onSingleFileOutput(session.getId())
    });
  }

}

module.exports = BrowserStackReporter
