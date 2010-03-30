require 'typhoeus'
require 'hydra/provider'

class Jetpants; class Hydra
  attr_reader :providers

  def initialize(providers = {})
    @providers = providers
  end

  def run
    hydra    = Typhoeus::Hydra.new
    requests = {}
    results  = {}

    @providers.each do |name, provider|
      request = requests[name] = Typhoeus::Request.new(provider.url,
          provider.options)

      request.on_complete {|response| provider.extract(response) }
      hydra.queue(request)
    end

    hydra.run

    requests.each {|name, request| results[name] = request.handled_response }

    requests = nil
    hydra    = nil

    results
  end

end; end
