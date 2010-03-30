class Jetpants; class Provider
  autoload :BOSS, 'jetpants/hydra/provider/boss'

  # Default HTTP headers to send with each request. This is used in
  # DEFAULT_REQUEST_OPTIONS below.
  DEFAULT_HEADERS = {:'Accept-Encoding' => 'gzip,deflate'}

  # Default Typhoeus request options for each request.
  DEFAULT_REQUEST_OPTIONS = {
    :follow_location => true,
    :headers         => DEFAULT_HEADERS,
    :max_redirects   => 2,
    :timeout         => 500,
    :user_agent      => ENV['JETPANTS_HYDRA_USER_AGENT'] || 'Jetpants-Hydra/1.0 (+http://jetpants.com)'
  }

  attr_reader :options, :request_options

  # Initializes a new Provider with the specified Provider-specific options.
  def initialize(options = {})
    @options         = options
    @request_options = DEFAULT_REQUEST_OPTIONS
  end

  # Receives a raw Typhoeus::Response object after a request has finished, and
  # returns either +nil+ (indicating that there was no useful data in the
  # response, or that the response was an error) or a Hash containing parsed
  # data extracted from the response.
  def extract(response)
  end

  # Returns the URL (as a String) that should be used to perform the request for
  # this Provider instance.
  def url
  end

  # Various utility methods for providers.
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
