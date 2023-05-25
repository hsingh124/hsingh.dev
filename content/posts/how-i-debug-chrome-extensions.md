---
title: "How I'm debugging my chrome extension"
date: 2022-10-18T10:45:09+13:00
tags: ['Frontend']
summary: "This is a short post where I share how I debug my chrome extension using webpack development mode. Nothing too fancy here, just something I didn't know about so thought might share it."
draft: true
---

I've been working on a chrome extension for some time. It's called Note it Down and is a note taking chrome extension. It basically lets you take notes on any webpage on any selected text and provides a dashboard to manage all the notes. One of the main issues I encountered while working on this was debugging. Initially, I was just using logging to debug but as my codebase got larger it became much more difficult and time consuming to just use logging. I also couldn’t find any way to step through a chrome extension’s code and debug it.

All my code for this chrome extension is in TypeScript and I’m using webpack for bundling. When I started development, I was still pretty new to webpack and was just hacking around without properly understanding it. I copied some config from GitHub and started developing. When I tried to debug, I couldn’t find a way to step through my code from my IDE, so I tried chrome’s debugger but all my code was bundled by webpack and really difficult to understand. I couldn’t debug this code.

<IMG of bundled code here>

So while researching online, I learned about webpack’s development mode. Basically, in development mode webpack would use something called source maps which helps the browser translate the bundled code into how the code actually looked when it was coded. The development mode can be used by setting `mode: development` in your webpack config. Alternatively, you can add `—mode development` when you use webpack through your CLI.

<!-- don't forget to mention the cheap-module-source-map thing. Try out the whole debugging again -->

<!-- mention content-scripts.js -->
