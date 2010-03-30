require 'yajl'

# Generic BOSS provider.
class Jetpants::Provider::BOSS < Jetpants::Provider
  include Utils

  autoload :Web, 'jetpants/hydra/provider/boss/web'

  API_BASEURI = 'http://boss.yahooapis.com/ysearch'
  API_VERSION = :v1
  APP_ID       = ENV['JETPANTS_BOSS_APPID'] || nil

  def initialize(options = {})
    super(options)

    raise ArgumentError, 'Missing query' unless @options[:query]

    unless @options[:app_id] ||= APP_ID
      raise ArgumentError, 'Missing BOSS app id'
    end

    @options[:boss_args] ||= {}
    @options[:boss_args][:count] ||= @options[:count] if @options.has_key?(:count)
    @options[:boss_args][:start] ||= @options[:start] if @options.has_key?(:start)

    @request_options[:headers].merge!({
      :Accept           => 'application/json,application/xml;q=0.9',
      :'Accept-Charset' => 'utf-8,ISO-8859-1;q=0.9,*;q=0.8'
    })
  end

  def extract(response)
    # TODO: log errors
    return nil unless response.code.to_i == 200

    parsed_response = Yajl::Parser.parse(response.body, :symbolize_keys => true)[:ysearchresponse]

    {
      :extracted  => {
        :count     => parsed_response[:count].to_i,
        :deephits  => parsed_response[:deephits].to_i,
        :start     => parsed_response[:start].to_i,
        :totalhits => parsed_response[:totalhits].to_i
      },

      :parsed_response => parsed_response
    }

  # TODO: rescue other errors as well?
  rescue Yajl::ParseError => ex
    return nil
  end

  def url
    "#{API_BASEURI}/#{@options[:vertical]}/#{API_VERSION}/" <<
        "#{escape(@options[:query])}?" <<
        build_query(@options[:boss_args].merge({:appid => @options[:app_id]}))
  end

  class APIError < StandardError; end
end
