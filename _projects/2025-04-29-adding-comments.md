---
title: 'Adding comments with Staticman to my Jekyll website'
date: 2025-04-29
permalink: /projects/2025/04/adding-comments-to-my-static-website/
show_excerpt: true
---

I recently decided to add comments to my static personal Jekyll website. There are a couple options based on my reading online, but I decided to use [Staticman](https://staticman.net/) because it was opensource and in theory totally free. 


Here is a brief description of how I set it up. 

## Step 1: Creating a new Github account

![](/images/2025-04-static-comments/new_github_account_with_classic_token.png)

## Step 2: Hosting staticman

The Staticman api works by processing comments and merging pull requests in the static website repository. The Staticman [documentation](https://staticman.net/docs/getting-started) suggests hosting with Heroku, but the free tier that apparently existed when the Staticman documentation was written no longer exists in 2025. Instead, I choose to host an instance with Render.

I was able to create a new `Web Service` and select the `hobby project` tier which was $0 per month. 

![](/images/2025-04-static-comments/render.png)





