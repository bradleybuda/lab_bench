require 'rubygems'
require 'bundler'
begin
  Bundler.setup(:default, :development)
rescue Bundler::BundlerError => e
  $stderr.puts e.message
  $stderr.puts "Run `bundle install` to install missing gems"
  exit e.status_code
end
require 'rake'

require 'jeweler'
Jeweler::Tasks.new do |gem|
  # gem is a Gem::Specification... see http://docs.rubygems.org/read/chapter/20 for more options
  gem.name = "lab_bench"
  gem.homepage = "http://github.com/bradleybuda/lab_bench"
  gem.license = "MIT"
  gem.summary = %Q{A browser-based runner for Test::Unit}
  gem.description = %Q{Like autotest, but in your browser. Currently unsuitable for use by anyone.}
  gem.email = "bradleybuda@gmail.com"
  gem.authors = ["Bradley Buda"]
  
  gem.add_runtime_dependency 'sinatra', '~> 1.1.0'
  gem.add_runtime_dependency 'eventmachine', '~> 0.12.10'
  gem.add_runtime_dependency 'em-websocket', '~> 0.2.0'
  gem.add_runtime_dependency 'thin', '~> 1.2.0'
  gem.add_runtime_dependency 'yajl-ruby', '~> 0.7.8'
  #  gem.add_development_dependency 'rspec', '> 1.2.3'

  gem.files.include 'assets/**/*'
end
Jeweler::RubygemsDotOrgTasks.new

require 'rake/testtask'
Rake::TestTask.new(:test) do |test|
  test.libs << 'lib' << 'test'
  test.pattern = 'test/**/test_*.rb'
  test.verbose = true
end

require 'rcov/rcovtask'
Rcov::RcovTask.new do |test|
  test.libs << 'test'
  test.pattern = 'test/**/test_*.rb'
  test.verbose = true
end

task :default => :test

require 'rake/rdoctask'
Rake::RDocTask.new do |rdoc|
  version = File.exist?('VERSION') ? File.read('VERSION') : ""

  rdoc.rdoc_dir = 'rdoc'
  rdoc.title = "lab_bench #{version}"
  rdoc.rdoc_files.include('README*')
  rdoc.rdoc_files.include('lib/**/*.rb')
end
