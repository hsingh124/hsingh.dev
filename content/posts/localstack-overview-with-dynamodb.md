---
title: "Localstack Overview with DynamoDB"
date: 2022-10-18T10:45:09+13:00
tags: ['Cloud']
summary: "This goes through a quick project which involves setting up Localstack as a mock local cloud environment for testing/development and writing go scripts using the AWS SDK for creating a table, populating it and getting all the data."
---

[Localstack](https://localstack.cloud/) is a cloud service emulator. It gives you a mock local AWS setup that you can use for testing and development instead of using an actual cloud service. In this post, we'll be setting up Localstack and writing some go code using the AWS SDK to create a DynamoDB table inside of our Localstack environment, populate the table with fake data and get all the data from the table.

### Setting up Localstack
Based on [localstack's docs](https://docs.localstack.cloud/get-started/), the best way to install it is using pip (a python package manager). You would need the following installed on your system:
- `python` (Python 3.7 up to 3.10 is supported)
- `pip` (Python package manager)
- `docker`

Running the following command in the terminal should install Localstack:
```console
python3 -m pip install localstack
```
**_NOTE:_**  There might be a case where after installing the Localstack cli might not work. I encountered this issue where I would type a command and nothing would happen. My terminal would just stay stuck. I believe the reason was that the CLI was not automatically downloading the required docker image. I am not sure why this happened but for reference, I am using an M1 Macbook Pro. To resolve this you can get the image by running the following command in the terminal:
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

These are the required imports for this code which can be added to your project using to `go get` command:
```go
import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)
```

Here is the code:
```go
sess, _ := session.NewSession(&aws.Config{
    Region:           aws.String("us-east-1"),
    Credentials:      credentials.NewStaticCredentials("test", "test", ""),
    Endpoint:         aws.String("http://localhost:4566"),
})

svc := dynamodb.New(sess)
```
The above code initializes a session that the AWS SDK will use. This session will connect to our Localstack setup which is hosted on port 4566 as specified to the Endpoint field. Then we create a DynamoDB client using that session.

### Creating a Table
Let's create a table called _Students_ that holds data about which subjects students are enrolled in. We'll have two attributes in this table, the student's id which will be a number and the subject the student is enrolled in which will be a string. We'll create a function called `createTable` that'll take the DynamoDB client that we created earlier as an arguent and create the table.

The following imports were used in this function:
```go
import (
	"log"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)
```

Below is the function to create the table:
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
Now lets populate the students table with some fake data. To do this, we will write another function that will take the DynamoDB client as a argument.

The following imports were used in this function:
```go
import (
	"log"
	"strconv"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)
```

Below is the function to populate the DB:
```go
func populateDb(svc *dynamodb.DynamoDB) {
	type Item struct {
		StudentId	int
		Subject		string
	}

	for i := 1; i < 100; i++ {
		item := Item{
			StudentId: i,
			Subject: "Subject" + strconv.Itoa(i),
		}

		av, err := dynamodbattribute.MarshalMap(item)
		if err != nil {
			log.Fatalf("Got error marshalling new movie item: %s", err)
		}

		tableName := "Students"

		input := &dynamodb.PutItemInput{
			Item:      av,
			TableName: aws.String(tableName),
		}

		_, err = svc.PutItem(input)
		if err != nil {
			log.Fatalf("Got error calling PutItem: %s", err)
		}
	}
}
```
The above code will populate our database with 99 records. We have first defined a struct called `Item` that specifies the structure of our table and what attributes we have. Then we just go in a loop and add data. We create an object of the type `Item` and pass it through the `MarshalMap` function. All this function will do is convert our object of `Item` type to a format that DynamoDB APIs can operate with. This is the type that `MarshalMap` returns: `(map[string]*dynamodb.AttributeValue, error)`. Once that is done, we call the `PutItemInput` function to add this entry to our database. We specify the Item which is the data that we put and then the table name we put this data into.

### Retrieving all Data from Localstack
Now lets write a script to retrieve all the data we added. Similar to the other functions this will also take in the DynamoDB client as an argument. This function would return an array of objects where each object is an entry from our database, so we have to define a return type as well.

The following imports were used:
```go
import (
	"log"
	"strconv"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)
```

This function would return an array of objects that resemble a database entry, so we'll define a struct to achieve that.
```go
type Item struct {
	StudentId int
	Subject   string
}
```
Our function would return an array of objects which are of the type `Item`. Now, this struct is exactly the same as the struct used in the function `populateDb`. We can declare this struct at a global scope and use the same one in both places.

The function would look something like this:
```go
func getItems(svc *dynamodb.DynamoDB) []Item {
	tableName := "Students"

	proj := expression.NamesList(expression.Name("StudentId"), expression.Name("Subject"))

	expr, err := expression.NewBuilder().WithProjection(proj).Build()
	if err != nil {
		log.Fatalf("Got error building expression: %s", err)
	}

	params := &dynamodb.ScanInput{
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		ProjectionExpression:      expr.Projection(),
		TableName:                 aws.String(tableName),
	}

	items := []Item{}

	pageNum := 0
	err = svc.ScanPages(params,
		func(page *dynamodb.ScanOutput, lastPage bool) bool {
			pageNum++
			for _, i := range page.Items {
				studentId, err := strconv.Atoi(*i["StudentId"].N)
				if err != nil {
					log.Fatalln("Invalid Student ID")
				}

				item := Item{
					StudentId: studentId,
					Subject:   *i["Subject"].S,
				}

				items = append(items, item)
			}
			return pageNum <= 3
		})
	if err != nil {
		log.Fatalf("Query API call failed: %s", err)
	}

	return items
}
```

In the `NamesList` function, we specify the attribute names that we want from our database and it returns a projection expression. DynamoDB on operations like `Scan`, `GetItem`, etc returns all the attributes by default. By using this we can specify only the columns we need. Now in this, we have specified all the columns we had in the table anyways, but I thought I'll put this here for information. If we did not want to use this and wanted to print all of the data with all of the attributes, we could do that by removing all the expressions code. So the first half of the function would change and would look like the code below (I have commented out the code that we can remove): 
```go
tableName := "Students"

// proj := expression.NamesList(expression.Name("StudentId"), expression.Name("Subject"))

// expr, err := expression.NewBuilder().WithProjection(proj).Build()
// if err != nil {
// 	log.Fatalf("Got error building expression: %s", err)
// }

params := &dynamodb.ScanInput{
    // ExpressionAttributeNames:  expr.Names(),
    // ExpressionAttributeValues: expr.Values(),
    // ProjectionExpression:      expr.Projection(),
    TableName:                 aws.String(tableName),
}

items := []Item{}
``` 
For more information on this, check out these official doc pages: [Namelist](https://docs.aws.amazon.com/sdk-for-go/api/service/dynamodb/expression/#NamesList), [Projection Expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html)

After that we build the builder, we specify the projection builder using the `WithProjection` function. The expressions package also has methods like `WithCondition`, `WithFilter`, etc that can be used to add other expressions to our builder. Read more about them here in the [`Builder` type's documentation page](https://docs.aws.amazon.com/sdk-for-go/api/service/dynamodb/expression/#Builder).

We then specify the `ScanInput` parameters for the expression and table name [[docs about `ScanInput`](https://docs.aws.amazon.com/sdk-for-go/api/service/dynamodb/#ScanInput)]. Now, we use the `ScanPages` function to retrieve all the data from our table. We could have used just the `Scan` function as well for this, but `Scan` only returns a maximum of 1MB of data at a time. Our data is surely less that 1MB and `Scan` would have worked fine, but for this example lets just assume the data is more than 1MB. What `ScanPages` does is that it iterates over the pages of a scan operation, where each page being 1MB of data or less for the last page, calling the function `"fn"` specified in the second argument with the response data for each page. Basically, `fn` is called with a chunk of data, and when it's called again the data it gets starts from where the first chunk ended. This will stop iterating when `fn` returns false. So in our case, it will iterate for three pages [[docs for `ScanPages`](https://docs.aws.amazon.com/sdk-for-go/api/service/dynamodb/#DynamoDB.ScanPages)]. Inside of the function, we are just grabbing all the items for that page, iterating over them, converting them to our desired format and then appending them to a slice(or a dynamic array). We'll then just return this data in the end.

### Conclusion
In this post, we setup an offline mock AWS environment using Localstack. We then coded three functions in go using the AWS SDK to create a table in DynamoDB inside of our Localstack environment, populate it and retrieve all the data from it. We can call these three functions from the main funtion. These were just some demo scripts that we made today but we can code any thing we would for AWS on Localstack. Even for the CLI, we can use awslocal the same way we would use the AWS CLI. In future, I would like to explore creating an automated testing environment using Localstack. For this post, I've tried my best to explain all important points but I surely might have missed some. Feel free to contact me regarding questions, suggestions or anything you want to discuss. I have also tried to link all the relavant pages that might be helpful.

\
**Happy Coding!**