module LabBench
  ROOT = File.expand_path(File.join(File.dirname(__FILE__), '..'))
  ASSETS = File.join(ROOT, 'assets')
end

require 'lab_bench/test_runner'
