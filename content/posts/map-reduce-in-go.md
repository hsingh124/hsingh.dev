---
title: "Distributed Map Reduce implementation in Go"
date: 2023-06-24T01:52:36+12:00
summary: "This is my implementation for a distributed Map Reduce system developed in Go. I developed this as a part of the MIT 6.5840 (Distributed Systems) course which I was self studying online."
---

I recently started the MIT Distributed Systems course. The course materials are freely available online at [pdos.csail.mit.edu/6.824](https://pdos.csail.mit.edu/6.824/). In this blog post, I'll discuss my implementation of the first lab, which focuses on building a distributed Map Reduce system using Go.

Map Reduce is a programming model used for processing and generating large datasets. I highly recommend reading the [Map Reduce Paper](https://pdos.csail.mit.edu/6.824/papers/mapreduce.pdf) for a detailed understanding. However, in this post, I'll focus on the implementation rather than the intricacies of Map Reduce.

For this lab, I had to create a worker and a coordinator. The worker handles map and reduce tasks, while the coordinator manages the workers and assigns them jobs to perform.

### Overview of the system
The communication between the coordinator and the worker is established using RPC (Remote Procedure Call). The coordinator actively listens for RPC connections from the workers. When a worker requests a job, the coordinator assigns it a task, and the worker proceeds to execute the job. Once the worker completes the job, it notifies the coordinator about the successful completion. To ensure fault tolerance, the coordinator is designed to handle situations where a worker fails to perform a job within the expected timeframe. In such cases, the coordinator reassigns the job to another available worker.

In this implementation, both the coordinator and the worker have access to text files that store the inputs and results of all the jobs. Although this setup mimics a distributed system, it operates on a single machine. The processes communicate with each other using a Unix socket and share the same local file system. In an actual distributed implementation spread across multiple computers, a distributed file system like Google File System could replace the local file system.

### RPC argument and reply types
To define the RPC methods for the coordinator that workers can call, two methods were chosen: `GetJob` and `JobDone`. The `GetJob` method is used by workers to receive Map Reduce jobs to perform, while the `JobDone` method allows workers to notify the coordinator that a job has been completed.

For the `GetJob` method, which will only requires a reply arguments and no request arguments, the following reply type was implemented:
```go
type GetJobReply struct {
	Job        Job
	InputFiles []string
	TaskNumber int
	NReduce    int
}
```
In this implementation, `Job` is a union type implemented as follows:
```go
type Job string

const (
	Map    Job = "Map"
	Reduce Job = "Reduce"
	Exit   Job = "Exit"
)
```
The `Exit` job here tells the worker to stop processing.

As for the `JobDone` method, it doesn't require reply arguments and only needs request arguments. The following type was chosen for the request arguments:
```go
type JobDoneArgs struct {
	TaskNumber  int
	Job         Job
	OutputFiles []string
}
```
### Worker Implementation 
In my worker implementation, I employed an infinite loop that continuously requests jobs from the coordinator. This loop follows a consistent pattern: requesting a job, performing the job, notifying the coordinator upon completion, and then repeating the process. During each iteration, the worker examines the type of job it receives, such as "Map," "Reduce," or "Exit," and takes appropriate action accordingly.

For Map tasks, the worker receives a text file as an input dataset. Although, in this lab the coordinator only sends one input text file per Map operation, I have implemented the worker to handle multiple text files as well if the coordinator sends them. The worker then extracts the data from the file and performs the Map operation on it. The Map operation returns a list of intermediate key-value pairs that will later serve as inputs for the Reduce task. To prepare for the Reduce task, we need to write the results of the Map operation into files that will be used as inputs for the Reduce task. Each key-value pair is assigned a specific file based on a hash function, similar to `hash(key) % nReduce`, where `nReduce` represents the number of reduce tasks. Map task's output files follow the convention: `"mr-" + mapTaskNumber + "-" + hash(key) % nReduce`. Each Map task will have multiple output files for different Reduce tasks and therefore each Reduce task will have multiple input files.

After receiving the list of intermediate key-value pairs from the Map operation in each iteration, the worker sorts the list based on the keys. It is important to note that this list is not a hashmap but rather a collection of key-value pairs, which means there are multiple pairs with the same keys. For each cluster of keys, a string builder is employed to temporarily store the results, which are then collectively written to the file. Additionally, all the output file names are recorded, as they will be sent to the coordinator using the `JobDone` function. The significance of this recording will be further explained in the Coordinator Implementation section.

When it comes to the Reduce task, its output is directed to a single file, while multiple input files are received from the coordinator, as mentioned earlier. The first step in the Reduce process involves iterating through all the input files. The worker extracts data from each file and organizes it into a map of type `map[string][]string`. In this map, the keys correspond to the data units' key extracted from each file, and the values are arrays containing all the associated values for that key.

Subsequently, the worker proceeds to invoke the Reduce function for each key, passing in the key and its corresponding values as arguments. The results obtained from the Reduce function are then sorted according to their keys and written to the output file designated for the Reduce task. The naming format for the output file is `"mr-out-" + reduceTaskNumber`.

### Coordinator Implementation
The RPC server for the Coordinator was already implemented in the Lab. Each request to the RPC server is handled in a separate thread. The methods, `GetJob` and `JobDone`, as mentioned, had to be implemented. Two more methods, `MakeCoordinator` and `Done` specified in the lab were to be implemented. `MakeCoordinator` was for the initialisation of the Coordinator and `Done` would return when all the jobs are finished.

Let's take a look at the Coordinator struct and its associated types.
```go
type Coordinator struct {
	jobs                chan jobType
	inProgressJobs      map[Job]map[int]jobType
	remainingReduceJobs int
	remainingMapJobs    int
	reduceInputFiles    map[int]map[string]bool
	addReduceJobs       bool
	nReduce             int
	mu                  sync.Mutex
}

type jobType struct {
	job        Job
	inputFiles []string
	jobNumber int
}
```
The `jobs` channel is used to store pending jobs that need to be processed and assigned to workers. It is initialized with all the Map jobs. The buffer size of the channel is set to the greater value between the number of reduce tasks or the number of input files provided initially for the Map jobs.

The `inProgressJobs` map stores jobs that have been assigned to workers but have not yet been marked as completed through the `JobDone` method. The key represents the type of job (union type mentioned before), and the value is another map with the task/job number as the key and the corresponding job as the value. This ensures fault tolerance in the system by keeping track of jobs that are in progress. Fault tolerance will be discussed more in the paragraphs below.

The `remainingReduceJobs` and `remainingMapJobs` variables store the number of remaining Reduce and Map jobs, respectively. The initial value of remaining Map jobs is set to the number of input files, as there is one Map task per input file. However, the initial value of remaining Reduce jobs should not be based on the total number of Reduce tasks given to the coordinator. Instead, it should be dynamically determined based on the actual number of Reduce tasks required. This is because in some cases, there would be no key in the input data that would be written to a Map output file of a particular Reduce number. Therefore, based on this implementation, the number of Reduce jobs that would be processed would be less than the total number of Reduce jobs provided initially to the coordinator. The `reduceInputFiles` map helps handle this situation. It keeps track of the input files associated with each Reduce task. Whenever a new key is added to this map, the number of Reduce tasks is incremented.

The way `reduceInputFiles` works is, after the completion of each Map task, indicated by the invocation of `JobDone` with a Map task, the program goes through the provided output files from the Map task and extracts the last number from each filename. As discussed in the naming format above, this number represents the corresponding reduce task number. This is then used to populate `reduceInputFiles`, associating each reduce task number with its respective files. Below is a code snippet depicting this:
```go
for _, file := range args.OutputFiles {
	reduceNumber, err := strconv.Atoi(string(file[len(file)-1]))
	if err != nil {
		fmt.Println("Given file name does not satisfy the required format. File name should end with the reduce task number")
	}
	_, reduceNumberExists := c.reduceInputFiles[reduceNumber]
	if !reduceNumberExists {
		c.reduceInputFiles[reduceNumber] = make(map[string]bool)
		c.remainingReduceJobs += 1
	}
	c.reduceInputFiles[reduceNumber][file] = true
}
```

The `addReduceJobs` flag is used to determine when Reduce jobs should be added to the `jobs` channel. It is initially set to `true`, and Reduce jobs are added only when `remainingMapJobs == 0 && addReduceJobs` is true. After adding the Reduce jobs, the flag is set to `false`.

Now let's discuss fault tolerance. When a job is sent to a worker, it is added to the `inProgressJobs` map. When `JobDone` is called, the completed job is removed from the map. In the `GetJob` method, when a job is taken from the channel, a new goroutine is spawned. This goroutine waits for 10 seconds and then checks if the job is still in progress. If it is, it means the worker did not finish the job within the expected timeframe. In such cases, the goroutine puts the job back into the channel so that it can be assigned to another worker. Here's the improved implementation:
```go
func (c *Coordinator) GetJob(_, reply *GetJobReply) error {
	for {
		select {
		case job := <-c.jobs:
			reply.Job = job.job
			reply.InputFiles = job.inputFiles
			reply.TaskNumber = job.jobNumber
			reply.NReduce = c.nReduce

			c.mu.Lock()
			c.inProgressJobs[job.job][job.jobNumber] = job
			c.mu.Unlock()

			go func(job Job, taskNumber int) {
				time.Sleep(10 * time.Second)

				c.mu.Lock()
				jobToCheck := c.inProgressJobs[job][taskNumber]
				c.mu.Unlock()

				if len(jobToCheck.inputFiles) > 0 {
					c.jobs <- jobToCheck
				}
			}(job.job, job.jobNumber)

			return nil
		default:
			if c.Done() {
				reply.Job = Exit
				reply.InputFiles = []string{""}
				reply.TaskNumber = 0
				reply.NReduce = c.nReduce
				return nil
			}
		}
	}
}
```

As all the requests are handled concurrently, all shared data was protected by Locks to avoid conflicts.

### Conclusion
This blog post presented the implementation of a distributed Map Reduce system using Go, which is the first lab assignment for the MIT 6.5840 (Distributed Systems) course. The key focus in this implementation was concurrency and fault tolerance of the system. The workers and the coordinator work independently as separate programs. The coordinator is designed for concurrently handling multiple workers and also handles fault tolerance in cases where a worker does not complete the job in the expected timeframe.