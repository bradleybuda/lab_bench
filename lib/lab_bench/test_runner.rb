require 'test/unit'
require 'test/unit/ui/console/testrunner'
require 'test/unit/ui/testrunnermediator'

# might be a little hacky to subclass this, but it already provides so many useful methods
class LabBench::TestRunner < Test::Unit::UI::Console::TestRunner
  
  def initialize(*args)
    super(*args)
    
    # TODO which info do we want to extract from the test suite
    # suite has a name, and an array of tests
    # looks like the tests can recursively be either suites, or test instances (subclasses of TestCase?)
    # or should be be looking at rake? do we even know about rake here, or is this in a non rake-y subprocess?
    # it's probably in a rake_test_loader.rb process
    # what info do we need to persist and remanufacture the suite?
    STDERR.puts @suite.inspect
    
    if @lab_bench_enabled = mothership_alive?
      STDERR.puts "LabBench enabled - go to http://0.0.0.0:9020/ to see test results"
    else
      STDERR.puts "WARNING - could not detect LabBench server.  Run lab_bench_server to start it."
    end
    
    @guid = "suite_#{rand(2**64).to_s}"
  end
  
  private

  def attach_to_mediator
    if @lab_bench_enabled
      # Add listeners for the five main testing events and relay then to the server
      [
       Test::Unit::UI::TestRunnerMediator::STARTED,
       Test::Unit::UI::TestRunnerMediator::FINISHED,
       Test::Unit::TestResult::FAULT,
       Test::Unit::TestCase::STARTED,
       Test::Unit::TestCase::FINISHED,
      ].each do |event|
        @mediator.add_listener(event) do |*args|
          Net::HTTP.post_form(mothership_uri('test_event'), {:event => event, :args => args, :guid => @guid})
        end
      end
    end
    
    super
  end
    
  def mothership_alive?
    Net::HTTP.get(mothership_uri('ping'))
    true
  rescue
    false
  end

  def mothership_uri(method)
    URI.parse("http://0.0.0.0:9020/#{method}")
  end
end

# Register myself on load
require 'test/unit/autorunner'
Test::Unit::AutoRunner::RUNNERS[:lab_bench] = proc do |r|
  LabBench::TestRunner
end
