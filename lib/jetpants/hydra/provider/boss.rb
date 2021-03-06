# encoding: utf-8

# Generic BOSS provider.
class Jetpants::Provider::BOSS < Jetpants::Provider
  autoload :Images, 'jetpants/hydra/provider/boss/images'
  autoload :Web,    'jetpants/hydra/provider/boss/web'

  APP_ID = ENV['JETPANTS_BOSS_APPID'] || nil

  def initialize(options = {})
    super(options)

    raise ArgumentError, 'Missing BOSS app id' unless @options[:params][:appid] ||= APP_ID
    raise ArgumentError, 'Missing query' unless @options[:query]
    raise ArgumentError, 'Missing BOSS vertical' unless @options[:vertical]
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
    return nil unless @config['enabled']

    "#{@config['url']}/#{@options[:vertical]}/#{@config['version']}/" <<
        "#{escape(@options[:query])}?#{build_query(@options[:params])}"
  end
end
