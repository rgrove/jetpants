require 'yajl'

class Jetpants::Provider::BOSS < Jetpants::Provider
  include Utils

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
    @options[:vertical]  ||= :web

    @request_options[:headers].merge!({
      :Accept           => 'application/json,application/xml;q=0.9',
      :'Accept-Charset' => 'utf-8,ISO-8859-1;q=0.9,*;q=0.8'
    })
  end

  def extract(response)
    {:response => response.body}
  end

  def url
    "#{API_BASEURI}/#{@options[:vertical]}/#{API_VERSION}/" <<
        "#{escape(@options[:query])}?" <<
        build_query(@options[:boss_args].merge({:appid => @options[:app_id]}))
  end

  class APIError < StandardError; end
end
