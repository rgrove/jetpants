class Jetpants::Web < Jetpants::Base
  get '/' do
    # Convert all query parameters into hash parameters and redirect.
    unless params.empty?
      hash = params.map{|p| escape(p[0]) + '=' + escape(p[1])}.join('&')
      redirect("/##{hash}")
    end

    content_type('text/html', :charset => 'utf-8')
    cache_control(:public, :max_age => 1800)

    @resources = Jetpants::Config['resources']
    @templates = json_templates(:index)

    erubis(:index)
  end

end
