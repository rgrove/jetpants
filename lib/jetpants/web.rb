require 'erubis'
require 'sinatra/base'
require 'yajl'
require 'yaml'

class Jetpants::Web < Sinatra::Base
  set :root, Jetpants::ROOT_DIR

  get '/' do
    # Convert all query parameters into hash parameters and redirect.
    unless params.empty?
      hash = params.map{|p| escape(p[0]) + '=' + escape(p[1])}.join('&')
      redirect("/##{hash}")
    end

    content_type('text/html', :charset => 'utf-8')
    cache_control(:public, :max_age => 1800)

    erubis(:index, :locals => {:templates => json_templates(:index)})
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
