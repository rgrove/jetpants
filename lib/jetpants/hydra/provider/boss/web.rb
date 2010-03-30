class Jetpants::Provider::BOSS::Web < Jetpants::Provider::BOSS
  def initialize(options = {})
    super(options.merge({:vertical => :web}))
    @request_options[:timeout] = 1000
  end

  def extract(response)
    return nil unless boss_response = super(response)

    extracted       = boss_response[:extracted]
    parsed_response = boss_response[:parsed_response]

    return nil unless parsed_response.has_key?(:resultset_web)

    extracted[:results] = parsed_response[:resultset_web].map do |result|
      {
        :abstract => result[:abstract],
        :date     => result[:date],
        :dispurl  => result[:dispurl],
        :size     => result[:size].to_i,
        :title    => result[:title],
        :url      => result[:url]
      }
    end

    extracted
  end
end
