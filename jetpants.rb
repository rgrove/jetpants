#!/usr/bin/env ruby
require 'rubygems'

require 'bossman'
require 'erubis'
require 'sinatra'
require 'yajl'

ERROR_MISSING_QUERY = 'No search query specified.'

BOSSMan.application_id = 'C82ywM3V34FSPr8EUqeE61WL6zQ1psBVArWY62MoVxyuljPRIfkcdnWSKDTKBuTkFsyMAkvp9Q--'

helpers do
  def json_error(message, code = 500)
    cache_control(:no_cache)
    halt(code, Yajl::Encoder.encode({:error => message}))
  end

  def search_web(query, options = {})
    boss = BOSSMan::Search.web(query, options)

    unless boss.responsecode.to_i == 200
      return {:responsecode => boss.responsecode}
    end

    results = boss.results.map do |result|
      {
        :abstract => result.abstract,
        :date     => result.date,
        :dispurl  => result.dispurl,
        :size     => result.size.to_i,
        :title    => result.title,
        :url      => result.url
      }
    end

    {
      :responsecode => boss.responsecode.to_i,
      :count        => boss.count.to_i,
      :deephits     => boss.deephits.to_i,
      :start        => boss.start.to_i,
      :totalhits    => boss.totalhits.to_i,
      :results      => results
    }
  end
end

get '/' do
  content_type('text/html', :charset => 'utf-8')
  cache_control(:public, :max_age => 1800)

  erubis :index
end

get '/api/search' do
  content_type('application/json', :charset => 'utf-8')

  unless query = params[:q]
    json_error(ERROR_MISSING_QUERY, 400)
  end

  cache_control(:public, :max_age => 600)

  count = (params[:count] || 10).to_i
  start = (params[:start] || 1).to_i

  Yajl::Encoder.encode(search_web(query, :count => count, :start => start))
end
