require 'test/unit'
require 'test/unit/ui/console/testrunner'
require 'test/unit/ui/testrunnermediator'

# might be a little hacky to subclass this, but it already provides so many useful methods
class LabBench::TestRunner < Test::Unit::UI::Console::TestRunner
  
  def initialize(*args)
    super(*args)
    
    connect_to_mothership
    @guid = "suite_#{rand(2**64).to_s}"
  end
  
  private

  def attach_to_mediator
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

    super
  end
    
  def connect_to_mothership
    # TODO probably don't want to abort tests if can't connect, maybe just warn
    raise 'could not communicate with mothership' unless mothership_alive?
  end
  
  def mothership_alive?
    Net::HTTP.get(mothership_uri('ping'))
    true
  rescue
    false
  end

  # TODO memoize
  def mothership_uri(method)
    URI.parse("http://localhost:9020/#{method}")
  end
  
end

# Register myself
require 'test/unit/autorunner'
Test::Unit::AutoRunner::RUNNERS[:lab_bench] = proc do |r|
  LabBench::TestRunner
end
