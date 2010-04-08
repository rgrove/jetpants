class Jetpants::Config; class << self
  # Adds the specified config Hash to the config lookup chain. Any configuration
  # values in _config_ will be used as defaults unless they're specified earlier
  # in the lookup chain.
  def <<(config)
    raise ArgumentError, "config must be a Hash" unless config.is_a?(Hash)

    (@lookup ||= []) << config
    cache_config

    @lookup
  end

  def fetch(name)
    (@cached || {})[name]
  end
  alias [] fetch

  def load
    @lookup = []

    # If we're in production, load only the production config. Otherwise, load
    # production plus the current environment's override config.
    files = Jetpants::RACK_ENV == :production ? [:production] :
        [Jetpants::RACK_ENV, :production]

    files.each do |file|
      filename = File.join(Jetpants::CONFIG_DIR, "#{file}.yaml")

      next unless File.exist?(filename)

      begin
        @lookup << YAML.load(Erubis::Eruby.new(File.read(filename)).result(binding)) || {}
      rescue => ex
        raise Jetpants::Error, "config error in #{filename}: #{ex}"
      end
    end

    cache_config
  end

  def method_missing(name)
    fetch(name.to_s) || {}
  end

  private

  # Merges configs such that those earlier in the lookup chain override those
  # later in the chain.
  def cache_config
    @cached = {}

    @lookup.reverse.each do |c|
      c.each {|k, v| @cached[k] = config_merge(@cached[k] || {}, v) }
    end
  end

  def config_merge(master, value)
    if value.is_a?(Hash)
      value.each {|k, v| master[k] = config_merge(master[k] || {}, v) }
      return master
    end

    value
  end

end; end
