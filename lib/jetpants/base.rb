# encoding: utf-8

require 'lilypad'
require 'sinatra/base'
require 'yajl'

class Jetpants::Base < Sinatra::Base
  set :logging, true
  set :root,    Jetpants::ROOT_DIR

  use Rack::Lilypad do
    api_key ENV['JETPANTS_HOPTOAD_KEY']
    sinatra
  end

  not_found do
    @q = unescape(request.path.gsub('/', ' ').strip)
    erubis(:'error/404')
  end

  helpers do
    # TODO: cache json templates when not in dev mode
    def json_templates(name)
      Yajl::Encoder.encode(YAML.load_file("#{settings.views}/#{name}.yaml"))
    end
  end
end
