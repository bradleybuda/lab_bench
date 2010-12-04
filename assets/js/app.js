head.ready(function(){
  var redrawTestrun = function(testrun) {
    // rerender the suite based on the updated data
    testrun.html(Mustache.to_html("\
      <testrunsummary class='{{status}}'> \
        <started> \
          Test Run Started {{timestamp}} - {{status}} \
          {{#running}} \
            <currenttest>{{currentTest}}</currenttest> \
          {{/running}} \
        </started> \
        <statistics> \
          <testcount>{{testCount}} total test(s): </testcount> \
          {{#hasfailures}} \
            <failedcount>{{failedCount}} failure(s)</failedcount> \
            {{#showfaults}} \
              <a class='hideFaults' href='#'>Hide Failures</a> \
            {{/showfaults}} \
            {{^showfaults}} \
              <a class='showFaults' href='#'>Show Failures</a> \
            {{/showfaults}} \
            {{#showfaults}} \
              <faults> \
                {{#faults}} \
                  <fault>{{.}}</fault> \
                {{/faults}} \
              </faults> \
            {{/showfaults}} \
          {{/hasfailures}} \
          {{^hasfailures}} \
            <failedcount>no failures</failedcount> \
          {{/hasfailures}} \
        </statistics> \
      </testrunsummary>", testrun.data()));
  };

  $('testruns').delegate('a.showFaults', 'click', function(){
    var testrun = $(this).closest('testrun');
    testrun.data().showfaults = true;
    redrawTestrun(testrun);
    return false;
  });

  $('testruns').delegate('a.hideFaults', 'click', function(){
    var testrun = $(this).closest('testrun');
    testrun.data().showfaults = false;
    redrawTestrun(testrun);
    return false;
  });

  // TODO don't assume localhost
  var socket = new WebSocket('ws://localhost:9021/');

  var suites = {};

  var templates = {
    "Test::Unit::UI::TestRunnerMediator::STARTED":
    "<testevent class='suiteStarted'><timestamp>{{timestamp}}</timestamp>Test Suite Started</testevent>",
    
    "Test::Unit::TestCase::STARTED":
    "<testevent class='testStarted'><timestamp>{{timestamp}}</timestamp>Test Started: {{args}}</testevent>",

    "FAULT":
    "<testevent class='testFault'><timestamp>{{timestamp}}</timestamp>{{args}}</testevent>",

    "Test::Unit::TestCase::FINISHED":
    "<testevent class='testFinished'><timestamp>{{timestamp}}</timestamp>Test Completed: {{args}}</testevent>",

    "Test::Unit::UI::TestRunnerMediator::FINISHED":
    "<testevent class='suiteFinished'><timestamp>{{timestamp}}</timestamp>Test Suite Completed in {{args}} seconds</testevent>"
  };

  socket.onopen = function (e) {
    // should indicate that we're connected
  };

  socket.onclose = function (e) {
    // should indicate that we're disconnected and maybe try to reconnect
  };

  socket.onmessage = function(jsonMessage) {
    if (jsonMessage && jsonMessage.data) {
      var message = $.parseJSON(jsonMessage.data);
      
      if (_.isEqual(message, ['backfilling'])) {
        $('appstatus').attr('class', 'backfilling');
      } else if (_.isEqual(message,['realtime'])) {
        $('appstatus').attr('class', 'realtime');
      } else {
        // append message to event log
        message.timestamp = new Date(message.milliseconds).toLocaleTimeString();
        var template = templates[message.event];
        $('eventlog')
          .append(Mustache.to_html(template, message))
          .scrollTop($('eventlog').attr('scrollHeight') - $('eventlog').height());

        // find or create the corresponding suite
        var guid = message.guid;
        if ($('#' + guid).length == 0) {
          $('testruns').prepend('<testrun id=' + guid + '>');
        }

        // update its data based on the event
        var testrun = $('#' + guid);
        var testrunData = testrun.data();
        if (message.event === "Test::Unit::UI::TestRunnerMediator::STARTED") {
          testrunData.guid = guid;
          testrunData.timestamp = new Date(message.milliseconds).toLocaleTimeString();
          testrunData.status = 'Initializing';
          testrunData.testCount = 0;
          testrunData.failedCount = 0;
          testrunData.hasfailures = false;
          testrunData.faults = [];
          testrunData.showfaults = false;
        } else if (message.event === "Test::Unit::TestCase::STARTED") {
          testrunData.status = 'Running';
          testrunData.currentTest = message.args;
          testrunData.running = true;
        } else if (message.event === "FAULT") {
          testrunData.failedCount += 1;
          testrunData.hasfailures = true;
          testrunData.faults.push(testrunData.currentTest);
        } else if (message.event === "Test::Unit::TestCase::FINISHED") {
          testrunData.running = false;
          testrunData.testCount += 1;
        } else if (message.event === "Test::Unit::UI::TestRunnerMediator::FINISHED") {
          if (testrunData.failedCount == 0) {
            testrunData.status = 'Success';
          } else {
            testrunData.status = 'Failed';
          }
        }

        redrawTestrun(testrun);
      }
    }
  };
});
