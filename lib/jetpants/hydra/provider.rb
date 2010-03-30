class Jetpants; class Provider
  autoload :BOSS, 'hydra/provider/boss'

  DEFAULT_HEADERS = {:'Accept-Encoding' => 'gzip,deflate'}

  DEFAULT_REQUEST_OPTIONS = {
    :follow_location => true,
    :headers         => DEFAULT_HEADERS,
    :max_redirects   => 2,
    :timeout         => 500,
    :user_agent      => ENV['JETPANTS_HYDRA_USER_AGENT'] || 'Jetpants-Hydra/1.0 (+http://jetpants.com)'
  }

  attr_reader :options, :request_options

  def initialize(options = {})
    @options         = options
    @request_options = DEFAULT_REQUEST_OPTIONS
  end

  def extract(response)
  end

  def url
  end

  module Utils
    # Builds a query string from a Hash. (Stolen from Rack)
    def build_query(params)
      params.map { |k, v|
        if v.class == Array
          build_query(v.map { |x| [k, x] })
        else
          "#{escape(k)}=#{escape(v)}"
        end
      }.join("&")
    end
    module_function :build_query

    # Performs URI escaping. (Stolen from Rack)
    def escape(s)
      s.to_s.gsub(/([^ a-zA-Z0-9_.-]+)/n) {
        '%' + $1.unpack('H2' * bytesize($1)).join('%').upcase
      }.tr(' ', '+')
    end
    module_function :escape

    # Unescapes a URI-escaped string. (Stolen from Rack)
    def unescape(s)
      s.tr('+', ' ').gsub(/((?:%[0-9a-fA-F]{2})+)/n) {
        [$1.delete('%')].pack('H*')
      }
    end
    module_function :unescape
  end
end; end
