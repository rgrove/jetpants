$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'lib'))

class Jetpants
  ROOT_DIR = ENV['JETPANTS_ROOT'] || File.dirname(File.expand_path(__FILE__))
end

require 'rubygems'
require 'jetpants'
require 'jetpants/api'
require 'jetpants/web'

map '/' do
  run Jetpants::Web
end

map '/api' do
  run Jetpants::Api
end
