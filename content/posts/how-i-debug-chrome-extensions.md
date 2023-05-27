---
title: "Notes from Chrome Extension Development: Debugging and Dynamic Script Injection"
date: 2023-05-27T10:45:09+13:00
tags: ['Frontend']
summary: "Some notes from my Chrome extension development. Debugging using webpack's development mode and source maps. Dynamically injecting content scripts from the background file for seamless updates."
---

### Debugging a Chrome Extension
When I first started working on my project, I encountered a major hurdle: debugging my Chrome extension. I wanted to connect my IDE to the extension so that I could step through the code, but I couldn't figure out a straightforward way to do it. Also, I was using TypeScript and webpack for bundling.

Fortunately, I came across a blog post titled [How to debug a webpack app in the browser](https://blog.jakoblind.no/debug-webpack-app-browser/), The post introduced me to webpack's development mode, which proved to be the quickest way to debug my Chrome extension. Previously, I mistakenly assumed that I would always see bundled code in my browser console. However, with the help of source maps provided by webpack's development mode, the bundled code was translated back into a a form that was closer to the original code. This allowed me to read and step through the code in my browser console, making debugging much more accessible.

Despite this, I encountered another obstacle: an `unsafe-eval` error. To resolve this issue, I delved deeper into the problem and discovered that I needed to change the style of source mapping used by webpack. By adding `devtool: 'cheap-module-source-map'` to my webpack configuration, I was able to overcome the unsafe-eval error. I found the solution in a helpful Stack Overflow post titled [Chrome extension compiled by Webpack throws `unsafe-eval` error](https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error).

### Injecting Content Scripts Dynamically
In the initial stages of development, I relied solely on the manifest file to define the content scripts for my Chrome extension. However, this approach posed a limitation: every time I made an update, I had to manually refresh the tabs for the changes to take effect. Seeking a more streamlined solution, I decided to dynamically inject the content scripts from the background file.

By implementing this new approach, I eliminated the need to manually refresh the tabs whenever I made updates. The changes now load instantly, providing a smoother development experience. Below, you'll find a code snippet demonstrating how to achieve this:

```ts
const injectContentScripts = (tab: chrome.tabs.Tab) => {
    if (tab.id && !tab.url?.startsWith('chrome-extension://')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/content_script.js']
        });
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(injectContentScripts);
    });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        injectContentScripts(tab);
    }
});
```
With this modification, the content script named 'contentScript.js' is injected dynamically, ensuring that the changes are immediately applied without requiring manual tab refreshing.


By combining the debugging insights gained through webpack's development mode and the efficient injection of content scripts, my Chrome extension development process has become significantly more productive and seamless.
