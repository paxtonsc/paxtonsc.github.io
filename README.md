# Academic Pages
**Academic Pages is a Github Pages template for academic websites.**

# Getting Started

1. Register a GitHub account if you don't have one and confirm your e-mail (required!)
1. Click the "Use this template" button in the top right.
1. On the "New repository" page, enter your repository name as "[your GitHub username].github.io", which will also be your website's URL.
1. Set site-wide configuration and add your content.
1. Upload any files (like PDFs, .zip files, etc.) to the `files/` directory. They will appear at https://[your GitHub username].github.io/files/example.pdf.
1. Check status by going to the repository settings, in the "GitHub pages" section
1. (Optional) Use the Jupyter notebooks or python scripts in the `markdown_generator` folder to generate markdown files for publications and talks from a TSV file.

See more info at https://academicpages.github.io/

## Running locally

When you are initially working your website, it is very useful to be able to preview the changes locally before pushing them to GitHub. To work locally you will need to:

1. Clone the repository.
1. Install the Ruby version in `.ruby-version` using your Ruby version manager, then install the Bundler version listed under `BUNDLED WITH` in `Gemfile.lock`.
1. Run `bundle install` to install the locked Ruby dependencies.
1. Run `bundle exec jekyll serve -l -H localhost` and open `http://localhost:4000` to preview the site.
1. If you change the JavaScript source, use Node.js to run `npm ci` and `npm run build:js`.

If you are running on Linux it may be necessary to install some additional dependencies prior to being able to run locally: `sudo apt install build-essential gcc make`