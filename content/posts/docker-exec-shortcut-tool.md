---
title: "My Docker Exec Shortcut Tool"
date: 2024-01-19T22:30:15+05:30
summary: This blog post is about a simple tool I created for easy access to Docker containers with tab completion for all active containers.
---

In this post I'll share a small tool I made that makes it easier to get into Docker container shells and also provides tab completion for all running containers. I used the [cobra](https://github.com/spf13/cobra) in Go to build it.

Here's the code for the tool:
```go
package main

import (
    "bufio"
    "bytes"
    "os"
    "os/exec"
    "strings"

    "github.com/spf13/cobra"
)

// Retrieves the names of all running Docker containers.
func getDockerContainerNames() ([]string, error) {
    cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
    var out bytes.Buffer
    cmd.Stdout = &out
    err := cmd.Run()
    if err != nil {
        return nil, err
    }

    var containerNames []string
    scanner := bufio.NewScanner(&out)
    for scanner.Scan() {
        containerNames = append(containerNames, scanner.Text())
    }

    return containerNames, scanner.Err()
}

// The completion function for container names.
func containersCompletionFunc(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
    containers, err := getDockerContainerNames()
    if err != nil {
        return nil, cobra.ShellCompDirectiveError
    }

    var completions []string
    for _, name := range containers {
        if strings.HasPrefix(name, toComplete) {
            completions = append(completions, name)
        }
    }
    return completions, cobra.ShellCompDirectiveNoFileComp
}

// Executes 'docker exec -it [containerName] bash'.
func executeDockerBash(containerName string) error {
    cmd := exec.Command("docker", "exec", "-it", containerName, "bash")
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Run()
}

func main() {
    var rootCmd = &cobra.Command{
        Use:   "de [container]",
        Short: "Quick and short docker exec",
        ValidArgsFunction: containersCompletionFunc,
        Args:  cobra.ExactArgs(1),
        Run: func(cmd *cobra.Command, args []string) {
            err := executeDockerBash(args[0])
            if err != nil {
                // Handle the error appropriately
                println("Error:", err.Error())
            }
        },
    }

    rootCmd.Execute()
}
```

I compiled this code and added the executable to the `/usr/local/bin` directory on my Mac. I named it `de`, which stands for `docker exec`. At first, I thought just using `ValidArgsFunction` would be enough for tab completions, but it wasn't. The completions were visible when using `__complete`, but they didn't work with the tab key. To fix this, I created a completion file in `~/.oh-my-zsh/completions` (I use [ohmyzsh](https://github.com/ohmyzsh/ohmyzsh) with zsh, but the location might be different depending on your shell). The file is named `_de`, like my tool. Here's the completion script for zsh:
```sh
#compdef de

_de() {
    local -a containers
    _arguments "*:container:($(docker ps --format "{{.Names}}"))"
}

_de
```

After doing this, I got the tab completions to work. Now, it shows all the running containers, and I can select them easily.