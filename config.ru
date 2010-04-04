$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), 'lib'))

require 'rubygems'
require 'jetpants'

map '/' do
  run Jetpants::Web
end

map '/api' do
  run Jetpants::Api
end

unless ENV['RACK_ENV'] == 'production'
  $LOAD_PATH.unshift('../weld/lib')
  require 'weld'

  Weld::Server.set(:config_file, File.join(Jetpants::CONFIG_DIR, 'weld.yaml'))

  map '/weld' do
    run Weld::Server
  end
end
