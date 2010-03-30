# TODO: Implement support for Retry-After in API responses
# require 'json'

class Jetpants::Provider::Twitter < Jetpants::Provider
  API_BASE = 'http://search.twitter.com/search.json'

  def initialize(options = {})
    super(options)

    # See http://apiwiki.twitter.com/Twitter-Search-API-Method:-search for
    # options supported by the Twitter Search API.

    raise ArgumentError, 'Missing query' unless @options[:query]

    @options[:params]     ||= {}
    @options[:params][:q] ||= @options[:query]
  end

  def extract(response)
    # TODO: log errors
    return nil unless response.code.to_i == 200

    # Twitter's result structure is good enough that we can just use their raw
    # results.
    Yajl::Parser.parse(response.body, :symbolize_keys => true)
  end

  def url
    "#{API_BASE}?#{build_query(@options[:params])}"
  end
end
