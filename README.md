# slsblog

This is the engine behind https://www.notsafeforproduction.com/

I had been moving my blog platform around to all sorts of different places, it had been up on a ghost server, I had created an ECS/Docker environment to run it (https://github.com/orionstein/docker-ghost), but eventually I decided that I wanted to port it to lambda/serverless.

The blog is rendered through serverless/lambda, and is rendered through neon/rust.

I wanted this to be flexible enough to use, so the templates in shared can be swapped out and adapted for changing themes, as this is based on ghost, some up to date ghost themes should work, but needs to be tested.

This ideally should work for anyone to run sls deploy, and it will run setup for dynamodb tables for blog, and set up the endpoints. The admin page uses the api gateway api key to post and work on blog posts. This way you don't need a pw, the account is tied to the api key.

There are two things that need to be done to make it run, give dynamodb access to the lambda iam user, and to add the generated api key to a usage plan. If the key is not on a usage plan, it will not register as a valid key.

To build the rust, these run through Docker, as we need to base on the AWS images so the resulting binaries are compatible with lambda. Building on your system will most likely not result in working binaries.

To Do:
  - Work on admin page, it can create posts, but clean it up and add post list to edit and remove existing posts
  - Add iam rules and possibly useage plan setup in cf, so it's 100% automated setup
  - Document more
