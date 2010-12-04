head.ready(function(){
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
        $('appstatus').addClass('backfilling');
      } else if (_.isEqual(message,['realtime'])) {
        $('appstatus').addClass('realtime');
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
        } else if (message.event === "Test::Unit::TestCase::STARTED") {
          testrunData.status = 'Running';
          testrunData.currentTest = message.args;
          testrunData.running = true;
        } else if (message.event === "FAULT") {
          testrunData.failedCount += 1;
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

        // rerender the suite based on the updated data
        testrun.html(Mustache.to_html("\
          <testrunsummary class='{{status}}'> \
            <started>Test Run Started {{timestamp}} - {{status}}</started> \
            {{#running}} \
              <currenttest>Current Test: {{currentTest}}</currenttest> \
            {{/running}} \
            <statistics> \
              <testcount>{{testCount}} total test(s)</testcount> \
              <failedcount>{{failedCount}} failure(s)</failedcount> \
            </statistics> \
          </testrunsummary>", testrunData));
      }
    }
  };
});
