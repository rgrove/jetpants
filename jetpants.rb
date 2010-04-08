require 'erubis'
require 'time'
require 'jetpants/utils'

class Jetpants
  include Jetpants::Utils

  RACK_ENV    = (ENV['RACK_ENV'] || :development).to_sym
  ROOT_DIR    = ENV['JETPANTS_ROOT']   || File.dirname(File.expand_path(__FILE__))
  CONFIG_DIR  = ENV['JETPANTS_CONFIG'] || File.join(ROOT_DIR, 'conf')

  class Error < StandardError; end
end

require 'jetpants/config'

Jetpants::Config.load

require 'jetpants/base'
require 'jetpants/api'
require 'jetpants/web'
