# encoding: utf-8

require 'typhoeus'
require 'jetpants/hydra/provider'

class Jetpants; class Hydra
  attr_reader :providers

  def initialize(providers = {})
    @providers = providers
  end

  def add(providers = {})
    @providers.merge!(providers)
  end

  def run
    hydra    = Typhoeus::Hydra.new
    requests = {}
    results  = {}

    @providers.each do |name, provider|
      # A nil url means this provider doesn't want to issue a request.
      next unless url = provider.url

      request = requests[name] = Typhoeus::Request.new(url,
          provider.request_options)

      request.on_complete {|response| provider.extract(response) || {} }
      hydra.queue(request)
    end

    hydra.run

    requests.each {|name, request| results[name] = request.handled_response }

    requests = nil
    hydra    = nil

    results
  end

end; end
