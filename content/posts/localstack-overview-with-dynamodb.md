---
title: "Localstack Overview with DynamoDB"
date: 2022-10-18T10:45:09+13:00
tags: ['Cloud']
summary: "This goes through a quick project which involves setting up localstack as a cloud dev/testing environment and writing a go script using the aws sdk for it."
---

[Localstack](https://localstack.cloud/) is a cloud service emulator. It gives you a mock local aws setup that you can use for testing and development instead of using an actual cloud service. In this post we'll be setting up localstack for local development environment and writing a go script using the aws sdk to fetch all the rows from a dynamodb instance on localstack.

### Setting up Localstack
Based on [localstack's docs](https://docs.localstack.cloud/get-started/), the best way to install it using pip(python package manager). You would need the following installed on your system:
- `python` (Python 3.7 up to 3.10 is supported)
- `pip` (Python package manager)
- `docker`

Running the following command in terminal should install localstack:
```console
python3 -m pip install localstack
```
**_NOTE:_**  There might be a case where after installing the localstack cli might not work. I encountered this issue where I would type a command and nothing would happen and it would just stay stuck. I believe the reason was that the cli was not automatically downloading the required docker image. I am not sure why this happened but for reference I am using an M1 Macbook Pro. To resolve this you can get the image by running the following command in terminal:
```console
docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```
Once you have the image, localstack cli should start working. Run the `localstack` in terminal to start localstack. By default, localstack starts on port 4566.

There are other ways to install and use localstack as well, check out their [getting started page](https://docs.localstack.cloud/get-started/).

I also used [`awslocal`](https://github.com/localstack/awscli-local) as my cli tool for interacting with my localstack aws environment. Assuming you already have `aws cli` installed, `awslocal` can be installed using: 
```console
pip install awscli-local
```
There are alternatives to this as well, more information can be found in the [official documentation](https://docs.localstack.cloud/integrations/aws-cli/).

`awslocal` works in the same way as `aws cli` does, so you can execute the same `aws cli` commands using `awslocal` by just replacing the `aws` keyword with `awslocal`. Here is an example that lists all the dynamodb tables:
```console
awslocal dynamodb list-tables
```

### Writing a script to populate DynamoDB in Localstack


### Writing a script to retrieve all data from DynamoDB in Localstack