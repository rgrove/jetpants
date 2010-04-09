# encoding: utf-8

require 'jetpants/hydra'

class Jetpants::Api < Jetpants::Base
  ERROR_MISSING_QUERY = 'No search query specified.'

  get '/search' do
    content_type('application/json', :charset => 'utf-8')

    unless query = params[:q]
      json_error(ERROR_MISSING_QUERY, 400)
    end

    cache_control(:public, :max_age => 600)

    count = (params[:count] || 10).to_i
    start = (params[:start] || 0).to_i

    Yajl::Encoder.encode(search(query, count, start))
  end

  helpers do
    def json_error(message, code = 500)
      cache_control(:no_cache)
      halt(code, Yajl::Encoder.encode({:error => message}))
    end

    def search(query, count = 10, start = 0)
      hydra = Jetpants::Hydra.new(
        :web => Jetpants::Provider::BOSS::Web.new(
          :query  => query,
          :params => {
            :count => count,
            :start => start
          }
        )
      )

      # Only hit these backends for the first page.
      if start < count
        hydra.add(
          :images => Jetpants::Provider::BOSS::Images.new(
            :query  => query,
            :params => {
              :count      => 4,
              :dimensions => 'medium,large,wallpaper'
            }
          ),

          :twitter => Jetpants::Provider::Twitter.new(
            :query  => query,
            :params => {
              :rpp => 3
            }
          )
        )
      end

      select_templates(hydra.run)
    end

    def select_templates(results)
      results[:templates] = {
        :web => {
          :pagination => erubis(:'common/pagination'),
          :results    => erubis(:'results/web')
        }
      }

      if results[:images]
        results[:templates][:images] = erubis(:'results/shortcuts/images')
      end

      if results[:twitter]
        results[:templates][:twitter] = erubis(:'results/shortcuts/twitter')
      end

      results
    end
  end

end
