# encoding: utf-8

# TODO: Implement support for Retry-After in API responses
require 'uri'

class Jetpants::Provider::Twitter < Jetpants::Provider
  def initialize(options = {})
    super(options)

    raise ArgumentError, 'Missing query' unless @options[:query]

    # See http://apiwiki.twitter.com/Twitter-Search-API-Method:-search for
    # params supported by the Twitter Search API.
    @options[:params]               ||= {}
    @options[:params][:lang]        ||= 'en'
    @options[:params][:q]           ||= @options[:query]
    @options[:params][:result_type] ||= 'mixed'
  end

  def extract(response)
    return nil unless super(response)

    now             = Time.now
    parsed_response = Yajl::Parser.parse(response.body, :symbolize_keys => true)
    response        = {:query => Rack::Utils.unescape(parsed_response[:query])}

    response[:results] = parsed_response[:results].map do |result|
      created_at = Time.parse(result[:created_at])

      result_data = {
        :created_ago       => Jetpants::Utils.time_diff_in_words(created_at, now, true),
        :created_at        => created_at.to_i,
        :from_user         => result[:from_user],
        :from_user_id      => result[:from_user_id],
        # :iso_language_code => result[:iso_language_code], # this is often wrong, so not much use to us
        :id                => result[:id],
        :metadata          => result[:metadata],
        :profile_image_url => result[:profile_image_url],
        :text              => autolink_tweet(result[:text])
      }

      result_data[:geo]        = result[:geo] if result[:geo]
      result_data[:to_user_id] = result[:to_user_id] if result[:to_user_id]
      result_data
    end

    response
  end

  def url
    return nil unless @config['enabled']
    "#{@config['url']}?#{build_query(@options[:params])}"
  end

  private

  # Parses tweet text and turns URLs, @usernames, and #hashtags into links.
  def autolink_tweet(tweet)
    index = 0
    html  = tweet.dup
    urls  = []

    # Extract URLs and replace them with placeholders for later.
    URI.extract(html.dup, ['http', 'https']) do |url|
      html.sub!(url, "__URL#{index}__")
      urls << url
      index += 1
    end

    # Replace URL placeholders with links.
    urls.each_with_index do |url, index|
      html.sub!("__URL#{index}__", "<a href=\"#{url}\">" <<
          "#{url.length > 26 ? url[0..26] + '…' : url}</a>")
    end

    # Turn @username into a link to the specified user's Twitter profile.
    html.gsub!(/@([a-zA-Z0-9_]{1,16})([^a-zA-Z0-9_])?/,
        '<a href="http://twitter.com/\1">@\1</a>\2')

    # Turn #hashtags into links.
    html.gsub!(/#([a-zA-Z0-9_]{1,32})([^a-zA-Z0-9_])?/,
        '<a href="http://search.twitter.com/search?q=%23\1">#\1</a>\2')

    return html
  end
end
