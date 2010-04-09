# encoding: utf-8

class Jetpants::Provider::BOSS::Images < Jetpants::Provider::BOSS
  def initialize(options = {})
    super(options.merge({:vertical => :images}))
  end

  def extract(response)
    return nil unless boss_response = super(response)

    extracted       = boss_response[:extracted]
    parsed_response = boss_response[:parsed_response]

    return nil unless parsed_response.has_key?(:resultset_images)

    extracted[:results] = parsed_response[:resultset_images].map do |result|
      {
        :abstract         => result[:abstract],
        :height           => result[:height].to_i,
        :referrerclickurl => result[:refererclickurl],
        :referrerurl      => result[:refererurl],
        :size             => result[:size].to_i,
        :thumbnail_height => result[:thumbnail_height].to_i,
        :thumbnail_url    => result[:thumbnail_url],
        :thumbnail_width  => result[:thumbnail_width].to_i,
        :title            => result[:title],
        :width            => result[:width].to_i
      }
    end

    extracted
  end
end
