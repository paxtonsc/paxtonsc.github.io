---
title: 'Adding comments with Staticman to my Jekyll website'
date: 2025-04-29
permalink: /projects/2025/04/adding-comments-to-my-static-website/
show_excerpt: true
---

I recently decided to add comments to my static personal Jekyll website. There are a couple options based on my reading online, but I decided to use [Staticman](https://staticman.net/) because it was opensource and in theory totally free. 


Here is a brief description of how I set it up. 

## Step 1: Creating a new Github account

Staticman works by submitting a pull request for each comment submitted. There are different routes for enabling Staticman to make a PR, but the one I ultimately was able to make work was creating a new github account `paxton-bot-account` and creating a personal access token for that new account under `Settings>Developer Settings`.

![](/images/2025-04-static-comments/classic_token.png)

Then I was able to invite the new account as a contributor to my static website repository `paxtonsc.github.io` and copy down the `GITHUB_TOKEN` produced in the previous step. 

## Step 2: Hosting Staticman

The Staticman api works by processing comments and merging pull requests in the static website repository. The Staticman [documentation](https://staticman.net/docs/getting-started) suggests hosting with Heroku, but the free tier that apparently existed when the Staticman documentation was written no longer exists in 2025. Instead, I choose to host an instance with Render.

I first cloned the [staticman repo](https://github.com/eduardoboucas/staticman) and deployed the the local clone as a a new `Web Service` with Render. I selected the `hobby project` service tier which was $0 per month. 

![](/images/2025-04-static-comments/render.png)

I set the following environment variables:

![](/images/2025-04-static-comments/env_variables.png)

The `GITHUB_TOKEN` is from the previous step. 

To generate the `PRIVATE_RSA_KEY` I used the command:
```
openssl genrsa
```

And `NODE_ENV: production`. 


## Step 3: Integrating with Jekyll Minimal Mistakes









