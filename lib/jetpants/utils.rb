class Jetpants; module Utils
  REGEX_URL_HOST = %r{^https?://([^/]+)}

  # Return the bytesize of String; uses String#length under Ruby 1.8 and
  # String#bytesize under 1.9. (Stolen from Rack)
  if ''.respond_to?(:bytesize)
    def bytesize(string)
      string.bytesize
    end
  else
    def bytesize(string)
      string.size
    end
  end
  module_function :bytesize

  # Builds a query string from a Hash. (Stolen from Rack)
  def build_query(params)
    params.map { |k, v|
      if v.class == Array
        build_query(v.map { |x| [k, x] })
      else
        "#{escape(k)}=#{escape(v)}"
      end
    }.join("&")
  end
  module_function :build_query

  # Performs URI escaping. (Stolen from Rack)
  def escape(s)
    s.to_s.gsub(/([^ a-zA-Z0-9_.-]+)/n) {
      '%' + $1.unpack('H2' * bytesize($1)).join('%').upcase
    }.tr(' ', '+')
  end
  module_function :escape

  # Returns the approximate difference between two Time objects in English.
  # Based on distance_of_time_in_words in the Rails ActionView DateHelper.
  def time_diff_in_words(from, to = Time.now, include_seconds = false)
    raw_seconds = (to - from).abs
    minutes     = (raw_seconds / 60).round
    seconds     = raw_seconds.round

    case minutes
      when 0..1
        unless include_seconds
          if minutes == 0
            return 'less than a minute'
          elsif minutes == 1
            return '1 minute'
          else
            return "#{minutes} minutes"
          end
        end

        case seconds
          when 0..4   then 'less than 5 seconds'
          when 5..9   then 'less than 10 seconds'
          when 10..19 then 'less than 20 seconds'
          when 20..39 then 'half a minute'
          when 40..59 then 'less than a minute'
          else             '1 minute'
        end

      when 2..44           then "#{minutes} minutes"
      when 45..89          then 'about an hour'
      when 90..1439        then "#{(minutes.to_f / 60.0).round} hours"
      when 1440..2879      then 'about a day'
      when 2880..43199     then "#{(minutes / 1440).round} days"
      when 43200..86399    then 'about a month'
      when 86400..525599   then "#{(minutes / 43200).round} months"
      when 525600..1051199 then 'about a year'
      else                      "#{(minutes / 525600).round} years"
    end
  end
  module_function :time_diff_in_words

  # Unescapes a URI-escaped string. (Stolen from Rack)
  def unescape(s)
    s.tr('+', ' ').gsub(/((?:%[0-9a-fA-F]{2})+)/n) {
      [$1.delete('%')].pack('H*')
    }
  end
  module_function :unescape

  # Returns the host portion of an HTTP or HTTPS URL. This method uses a simple
  # (and very loose) regex rather than using the URI class since URI's parser is
  # unnecessarily strict.
  def url_host(url)
    (url.match(REGEX_URL_HOST) || [])[1]
  end
  module_function :url_host

end; end
