# Base image: Ruby with necessary dependencies for Jekyll
FROM ruby:3.4.13

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install the same locked dependencies used by GitHub Pages.
COPY .ruby-version Gemfile Gemfile.lock ./
ENV BUNDLE_FROZEN=true

# Install bundler and dependencies
RUN bundle install

# Expose port 4000 for Jekyll server
EXPOSE 4000

# Command to serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--watch"]

