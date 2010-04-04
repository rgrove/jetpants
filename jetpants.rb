class Jetpants
  ROOT_DIR    = ENV['JETPANTS_ROOT']   || File.dirname(File.expand_path(__FILE__))
  CONFIG_DIR  = ENV['JETPANTS_CONFIG'] || File.join(ROOT_DIR, 'conf')
  CONFIG_FILE = File.join(CONFIG_DIR, "#{ENV['RACK_ENV'] || :development}.yaml")
end

require 'jetpants/base'
require 'jetpants/api'
require 'jetpants/web'
