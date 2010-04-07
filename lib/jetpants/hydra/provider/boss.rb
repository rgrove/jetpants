# Generic BOSS provider.
class Jetpants::Provider::BOSS < Jetpants::Provider
  autoload :Web, 'jetpants/hydra/provider/boss/web'

  API_BASE    = 'http://boss.yahooapis.com/ysearch'
  API_VERSION = :v1
  APP_ID      = ENV['JETPANTS_BOSS_APPID'] || nil

  def initialize(options = {})
    super(options)

    raise ArgumentError, 'Missing BOSS app id' unless @options[:params][:appid] ||= APP_ID
    raise ArgumentError, 'Missing query' unless @options[:query]
    raise ArgumentError, 'Missing BOSS vertical' unless @options[:vertical]

    @options[:params][:count] ||= @options[:count] if @options.has_key?(:count)
    @options[:params][:start] ||= @options[:start] if @options.has_key?(:start)
  end

  def extract(response)
    return nil unless super(response)

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
  end

  def url
    "#{API_BASE}/#{@options[:vertical]}/#{API_VERSION}/" <<
        "#{escape(@options[:query])}?#{build_query(@options[:params])}"
  end
end
