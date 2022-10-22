---
title: "Localstack Overview with DynamoDB"
date: 2022-10-18T10:45:09+13:00
tags: ['Cloud']
summary: "This goes through a quick project which involves setting up Localstack as a cloud dev/testing environment and writing a go script using the AWS SDK for it."
---

[Localstack](https://localstack.cloud/) is a cloud service emulator. It gives you a mock local AWS setup that you can use for testing and development instead of using an actual cloud service. In this post, we'll be setting up Localstack as a local development environment and writing a go script using the AWS SDK to fetch all the rows from a DynamoDB instance on Localstack.

### Setting up Localstack
Based on [localstack's docs](https://docs.localstack.cloud/get-started/), the best way to install it using pip(python package manager). You would need the following installed on your system:
- `python` (Python 3.7 up to 3.10 is supported)
- `pip` (Python package manager)
- `docker`

Running the following command in the terminal should install Localstack:
```console
python3 -m pip install localstack
```
**_NOTE:_**  There might be a case where after installing the Localstack cli might not work. I encountered this issue where I would type a command and nothing would happen and it would just stay stuck. I believe the reason was that the CLI was not automatically downloading the required docker image. I am not sure why this happened but for reference, I am using an M1 Macbook Pro. To resolve this you can get the image by running the following command in the terminal:
```console
docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```
Once you have the image, Localstack CLI should start working. Run the `localstack` command in the terminal to start Localstack. By default, Localstack starts on port 4566.

There are other ways to install and use Localstack as well, check out the [getting started page](https://docs.localstack.cloud/get-started/).

I also used [`awslocal`](https://github.com/localstack/awscli-local) as my CLI tool for interacting with my Localstack AWS environment. Assuming you already have `aws cli` installed, `awslocal` can be installed using: 
```console
pip install awscli-local
```
There are alternatives to this as well, more information can be found in the [official documentation](https://docs.localstack.cloud/integrations/aws-cli/).

`awslocal` works in the same way as `aws cli` does, so you can execute the same `aws cli` commands using `awslocal` by just replacing the `aws` keyword with `awslocal`. Here is an example that lists all the DynamoDB tables:
```console
awslocal dynamodb list-tables
```

For this project, we'll create the AWS session and the DynamoDB client in the main function and define separate functions for each of the tasks we do as listed in the topics below. Each of these functions will be called from the main function and we'll pass the DynamoDB client as an argument.

Below is the code for creating an AWS session and a DynamoDB client. This code should be in the main function. The session we create will connect to our Localstack setup and treat that as the AWS environment.

```go
// Initialize a session that the AWS SDK will use. This session will connect to
// our Localstack setup which is hosted on port 4566 as specified to the 
// Endpoint field.
sess, _ := session.NewSession(&aws.Config{
    Region:           aws.String("us-east-1"),
    Credentials:      credentials.NewStaticCredentials("test", "test", ""),
    Endpoint:         aws.String("http://localhost:4566"),
})

// Create a dynamoDB client
svc := dynamodb.New(sess)
```

### Creating a Table
Let's create a table called _Students_ that holds data about which subjects students are enrolled in. We'll have two attributes in this table, the student's id which will be a number and the subject the student is enrolled in which will be a string. We'll create a function called `createTable` that'll take the DynamoDB client that we created earlier as an arguent and create the table.

```go
func createTable(svc *dynamodb.DynamoDB) {
    tableName := "Students"

    input := &dynamodb.CreateTableInput{
        AttributeDefinitions: []*dynamodb.AttributeDefinition{
            {
                AttributeName: aws.String("StudentId"),
                AttributeType: aws.String("N"),
            },
            {
                AttributeName: aws.String("Subject"),
                AttributeType: aws.String("S"),
            },
        },

        KeySchema: []*dynamodb.KeySchemaElement{
            {
                AttributeName: aws.String("StudentId"),
                KeyType:       aws.String("HASH"),
            },
            {
                AttributeName: aws.String("Subject"),
                KeyType:       aws.String("RANGE"),
            },
        },

        ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
            ReadCapacityUnits:  aws.Int64(10),
            WriteCapacityUnits: aws.Int64(10),
        },

        TableName: aws.String(tableName),
    }

    _, err := svc.CreateTable(input)
    if err != nil {
        log.Fatalf("Got error calling CreateTable: %s", err)
    }
}
```
In the above code, we have defined the structure of our table. We have specified that it will have two attributes, `StudentId` of type number ('N') and `Subject` of type string ('S'). We also specify the key schema or primary key which will uniquely identify each element. `StudentId` is a partition key (aka hash key) and `Subject` is a sort key (aka range key). In short, this means that each item is uniquely identified by the combination of these two keys. For our table, this means we can have multiple items with the same student id but each student can only be enrolled in a particular subject once. So the combination of student id and the subject is always unique. Read more about this on the [official AWS docs page here](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey). After that we specify the provisioned throughput which specifies the maximum number of reads or writes consumed per second before DynamoDB returns a `ThrottlingException`. Read more about this on [this page](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ProvisionedThroughput.html).

Now we can call this function from our main function and pass in the DynamoDB client we created as an argument.

### Populating the table


### Retrieving all Data from Localstack
