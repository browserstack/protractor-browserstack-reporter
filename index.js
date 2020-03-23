var path = require('path'),
  fs = require('fs'),
  mkdirp = require('mkdirp');

var suites = {};
var specs = {};
var myReporter = {

  suiteStarted: function(suite){
    currentSuite = suite;
    currentSuite.specs = []
  },

  suiteDone: function(suite) {
    suites[suite.id] = suite
  },

  jasmineDone: function(){
    this.onSingleFileOutput(suites)
  },

  specDone: function(spec) {
    browser.getSession().then(function(session) {
      spec.sessionID = session.getId();
      currentSuite.specs.push(spec)
      specs[spec.id] = spec
    });
  },

  onSingleFileOutput: function (suites) {
    const xml = this.prepareXml(suites)
    var write = this.write;
    browser.getProcessedConfig().then(function(config) {
      var browserName = config.capabilities.browserName;
      let filename = `REPORT-browserstack.${browserName}.xml`
      write(filename, xml)
    });
  },

  prepareName: function(name = 'Skipped test') {
    return name.split(/[^a-zA-Z0-9]+/).filter(
      (item) => item && item.length
    ).join('_')
  },

  prepareXml: function(suites){
    var xmlbuilder = require('xmlbuilder');
    const builder = xmlbuilder.create('testsuites', {encoding: 'UTF-8', allowSurrogateChars: true})
    for (let suiteIndex in suites) {
      const suite = suites[suiteIndex]
      const suiteName = this.prepareName(suite.description)
      const testSuite = builder.ele("testsuite", {name: suiteName})
      let SESSION_ID;
      for (let specIndex in suite.specs) {
        const test = suite.specs[specIndex]
        const testName = this.prepareName(test.description)
        const { sessionID } = test;
        SESSION_ID = sessionID;
        const testCase = testSuite.ele("testcase",{name: testName, id: `${suiteName}_${sessionID}.${testName}{0}`, index: 0 });
        testCase.ele("session", {}, sessionID);
      }
      testSuite.att('name', `${suiteName}_${SESSION_ID}`);
    }
    return builder.end({ pretty: true});
  },

  write: function(filename, xml) {
    var outputDir = "./browserstack-reports"
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
  },

  format: function(val) {
      return JSON.stringify(baseReporter.limit(val))
  }
}

var BrowserStackReporter = {
  name: "browserstack-protractor-plugin",

  onPrepare: function() {
    jasmine.getEnv().addReporter(myReporter);
  },
}

module.exports = BrowserStackReporter
