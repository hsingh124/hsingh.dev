---
title: "Localstack Overview with DynamoDB"
date: 2022-10-18T10:45:09+13:00
tags: ['Cloud']
summary: "This goes through a quick project which involves setting up localstack as a cloud dev/testing environment and writing a go script using the aws sdk for it."
---

[Localstack](https://localstack.cloud/) is a cloud service emulator. It gives you a mock local aws setup that you can use for testing and development instead of using an actual cloud service. In this post we'll be setting up localstack for local development environment and writing a go script using the aws sdk to fetch all the rows from a dynamodb instance on localstack.

### Localstack Setup
Based on [localstack's docs](https://docs.localstack.cloud/get-started/), the best way to install it using pip(python package manager). You would need the following installed on your system:
- `python` (Python 3.7 up to 3.10 is supported)
- `pip` (Python package manager)
- `docker`

Running the following command should install localstack:
```console
$ python3 -m pip install localstack
```
**_NOTE:_**  There might be a case where after installing the localstack cli might not work. I encountered this issue where I would type a command and nothing would happen and it would just stay stuck. I believe the reason was that the cli was not automatically downloading the required docker image. I am not sure why this happened but for reference I am using an M1 Macbook Pro. To resolve this you can get the image by running the following command:
```console
docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```
Once you have the image, localstack cli should start working.

