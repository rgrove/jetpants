# encoding: utf-8

require 'yajl'

class Jetpants; class Provider
  include Jetpants::Utils

  autoload :BOSS,    'jetpants/hydra/provider/boss'
  autoload :Twitter, 'jetpants/hydra/provider/twitter'

  # Default HTTP headers to send with each request. This is used in
  # DEFAULT_REQUEST_OPTIONS below.
  DEFAULT_HEADERS = {
    :Accept            => 'application/json',
    :'Accept-Charset'  => 'utf-8,ISO-8859-1;q=0.9,*;q=0.8',

    # Typhoeus doesn't support gzip or deflate, even though libcurl does. Argh.
    # TODO: fork Typhoeus and patch it to support CURLOPT_ENCODING
    # :'Accept-Encoding' => 'gzip,deflate'
  }

  # Default Typhoeus request options for each request.
  DEFAULT_REQUEST_OPTIONS = {
    :follow_location => true,
    :headers         => DEFAULT_HEADERS.dup,
    :max_redirects   => 2,
    :timeout         => 500,
    :user_agent      => ENV['JETPANTS_HYDRA_USER_AGENT'] || 'Jetpants-Hydra/1.0 (+http://jetpants.com)'
  }

  attr_reader :config, :options, :request_options

  # Initializes a new Provider with the specified Provider-specific options.
  def initialize(options = {})
    @config             = Jetpants::Config.providers[self.class.name.split('::')[-1].downcase] || {}
    @options            = options
    @options[:params] ||= {}

    @request_options = DEFAULT_REQUEST_OPTIONS.dup
    @request_options[:timeout] = @config['timeout'] if @config['timeout']
  end

  # Receives a raw Typhoeus::Response object after a request has finished, and
  # returns either +nil+ (indicating that there was no useful data in the
  # response, or that the response was an error) or a Hash containing parsed
  # data extracted from the response.
  def extract(response)
    # Raise on HTTP error codes. A response code of 0 means that the request
    # timed out, which we don't raise for.
    case response.code.to_i
    when 200
      response

    when 0
      nil

    else
      raise Error, "HTTP #{response.code} response from #{url}"
    end
  end

  # Returns the URL (as a String) that should be used to perform the request for
  # this Provider instance. If +nil+ is returned, no request will be executed
  # for this Provider.
  def url
  end

  class Error < Jetpants::Error; end
end; end
