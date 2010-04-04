require 'erubis'
require 'sinatra/base'
require 'yajl'

class Jetpants::Base < Sinatra::Base
  set :config, File.exist?(Jetpants::CONFIG_FILE) ? YAML.load_file(Jetpants::CONFIG_FILE) : {}
  set :root,   Jetpants::ROOT_DIR

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