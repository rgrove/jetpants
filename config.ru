$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'lib'))

require 'rubygems'
require 'jetpants'
require 'jetpants/api'
require 'jetpants/web'

class Jetpants
  ROOT_DIR = ENV['JETPANTS_ROOT'] || File.dirname(File.expand_path(__FILE__))
end

map '/' do
  run Jetpants::Web
end

map '/api' do
  run Jetpants::Api
end
