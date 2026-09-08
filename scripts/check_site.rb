#!/usr/bin/env ruby
require "set"
require "uri"

root = File.expand_path(ARGV.fetch(0, "_site"))
errors = []
html_files = Dir[File.join(root, "**/*.html")]

def local_target(root, source, value)
  path = value.split(/[?#]/, 2).first
  return if path.empty? || path.start_with?("mailto:", "tel:", "javascript:", "data:", "//")
  return if URI.parse(path).scheme
  absolute = path.start_with?("/") ? File.join(root, path) : File.expand_path(path, File.dirname(source))
  return absolute if File.file?(absolute)
  return File.join(absolute, "index.html") if File.file?(File.join(absolute, "index.html"))
  absolute
rescue URI::InvalidURIError
  nil
end

html_files.each do |file|
  html = File.read(file)
  relative = file.delete_prefix(root + "/")
  next if relative.start_with?("files/", "talkmap/")
  errors << "#{relative}: missing <html lang>" unless html.match?(/<html[^>]+lang=["'][^"']+/i)
  errors << "#{relative}: missing title" unless html.match?(/<title>\s*\S/i)

  unless relative == "sitemap/index.html" || relative == "tags/index.html"
    ids = html.scan(/\sid=["']([^"']+)["']/i).flatten
    ids.group_by(&:itself).each { |id, values| errors << "#{relative}: duplicate id #{id}" if values.length > 1 }
  end

  html.scan(/<img\b[^>]*>/i).each do |tag|
    errors << "#{relative}: image missing alt: #{tag[0, 100]}" unless tag.match?(/\balt=["'][^"']*["']/i)
  end

  html.scan(/\b(?:href|src)=["']([^"']+)["']/i).flatten.each do |reference|
    target = local_target(root, file, reference)
    errors << "#{relative}: missing #{reference}" if target && !File.exist?(target)
  end
end

if errors.any?
  warn errors.uniq.join("\n")
  abort "Site audit failed with #{errors.uniq.length} issue(s)"
end

puts "Site audit passed (#{html_files.length} HTML files checked)"
