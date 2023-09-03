---
title: "Resolving npm install Permission Issues on Multipass"
date: 2023-09-03T15:48:38+12:00
summary: "In this post I'm sharing my experience using Multipass on my Apple Silicon Mac to upgrade Node.js within a project. I encountered a permission error while using npm install, which led me to a solution involving adjusting maxfiles limits, and I've documented the process with helpful resources."
---

I was working on upgrading the versions of some legacy software systems. As a part of this, I had to upgrade the node js version in a project. I use an M2 Macbook Pro and wanted to run docker through a virtual machine on it, so my tool of choice was multipass. I was running the LTS ubuntu on multipass and installed a docker VM through it. You can follow this guide to set it up: https://multipass.run/docs/docker-tutorial. I emulated the server environment in docker, the only difference being that I was using LTS node and npm versions. When I ran `npm install`, I was getting a permission error:
```sh
npm WARN tar TAR_ENTRY_ERROR EPERM: operation not permitted
```

After searching through some github issues on multipass's repo I found this one: https://github.com/canonical/multipass/issues/2528

The conversation here towards the [end](https://github.com/canonical/multipass/issues/2528#issuecomment-1198293627) described a maxfiles limit issue. This was the cause for my issue as well. Maxfiles basically specifies the maximum number of open file descriptors. A file descriptor is a unique identifier associated with an open file, socket, or other I/O resource. So the `npm install` operation running in the VM must have had a lot more file descriptors open while installing the packages. I used the `launchctl limit maxfiles` command to check my current default maxfiles limit and it 256, which seems very low. I followed this guide to update the limit: https://gist.github.com/devinrhode2/4cbf7f02a9701510d61f5be0515b8286 but you can also run something like `sudo launchctl limit maxfiles 200000 200000` to update the limit. While running the `sudo launchctl limit maxfiles 200000 200000` command I terminal gave me this message: `Could not set resource limits: 150: Operation not permitted while System Integrity Protection is engaged` and I couldn't update the limit. I found this post which had the fix: `https://developer.apple.com/forums/thread/735798`. I basically specifies to first run `launchctl limit maxfiles 256 unlimited` and then the same command with the required limits. Once the limits were updated, `npm install` worked flawlessly.

This was just a dev diary entry explaing an issue I encountered while trying to use multipass on an apple silicon mac and some of the useful resources I found online to solve this.


I was in the midst of upgrading some legacy software systems, and part of this endeavor involved upgrading the Node.js version within a specific project. I was using an M2 MacBook Pro and intended to run Docker through a virtual machine My tool of choice for this task was Multipass. I set up an LTS Ubuntu instance on Multipass and proceeded to install a Docker VM within it. You can refer to this guide for a step-by-step setup: [Running a container with the Docker blueprint in Multipass](https://multipass.run/docs/docker-tutorial).

I successfully emulated the server environment in Docker, with the only difference being the utilization of LTS Node and npm versions. However, as I executed the `npm install` command, I encountered this permission error:
```sh
npm WARN tar TAR_ENTRY_ERROR EPERM: operation not permitted
```

I delved into Multipass's GitHub repository and stumbled upon a relevant issue: [Insufficient permissions inside created Instance to install npm packages](https://github.com/canonical/multipass/issues/2528). [Towards the end](https://github.com/canonical/multipass/issues/2528#issuecomment-1198293627) of the conversation within that thread, a critical insight was shared, leading me to the root of my problem. It was a maxfiles limit issue.

The term "maxfiles" refers to the maximum number of open file descriptors. A file descriptor is a unique identifier associated with an open file, socket, or other I/O resource. Therefore, during the `npm install` operation within the virtual machine, there must have been more file descriptors in use than anticipated. I executed the `launchctl limit maxfiles` command to check my current default maxfiles limit, which was set to 256, which seemed inadequate. I followed this guide to update the limit: [How to Change Open Files Limit on OS X and macOS](https://gist.github.com/devinrhode2/4cbf7f02a9701510d61f5be0515b8286). AAlternatively, you can use the following command to update the limit: `sudo launchctl limit maxfiles 200000 200000`. When I ran this command, I got `Could not set resource limits: 150: Operation not permitted while System Integrity Protection is engaged` and couldn't update the limit. I came across this solution: [No Longer Able to Increase Maxfile Limits MacOS Recent Versions](https://developer.apple.com/forums/thread/735798). The fix involved running `launchctl limit maxfiles 256 unlimited`, which was the default limit before running `sudo launchctl limit maxfiles 200000 200000` to update to the new limit. With the limits appropriately updated, my `npm install` command worked flawlessly.

This entry serves as a developer diary, chronicling my encounter with an issue while attempting to utilize Multipass on an Apple Silicon Mac, along with some of the useful online resources I found to solve it.