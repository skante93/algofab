
# Fetch & Run Algorithm from Algofab  

## Table of contents

* [Objectives](#objectives)
* [Pre-requisites](#pre-requisites)
* [Outcome](#outcome)
* [Workflow Components](#workflow-components)
* [Conclusion](#conclusion)
* [Automatic script](#automatic-script)

## Objectives

The objective of the Workflow is to demonstrate how to use Algofab to lead scientific studies (or part of them).

### Context

The workflow comes to reflect partially a general scientific study use-case split into different steps. To take things easy it is assumed that the wofklow is only one step (step n) among others where an Algorithm, available on Algofab, can allow us to more easily surmount the challenge of step n. The Algorithm 

### Goal

Walktrhough the process of fetching Algorithm on Algofab and run it locally to bypass the current challenge coming from step n.    

### Choices

We assume algofab instance will be the public one, its API server's address is : https://ws67-af-api.tl.teralab-datascience.fr .


As stated, previously, to make the experiment simple, we chose an algorithm taking-in simple JPEG images as input an generates a _.gif_ image as output. As such, the Algorithm was called _**Giffer**_ and is available [here](https://ws67-af-portal.tl.teralab-datascience.fr) for further details.

We assume that Giffer has the following  resourceID : 5eddbccc3f6820007595308f .

## Pre-requisites

Here are the necessary points you should pay special attention to in order for the workflow to run successfully :

* Make sure you version of Algofab Instance has an API server and write down its address. In the rest of the workflow, we suppose the API Server will be responding to **_@APIServer_**.
* Make to have an algofab account created and validated. You can refer to [Account Management Workflow](../account_management/workflow.md)* Make sure an Algorithm exists in the **_@APIServer_**. If it does not, you can replace it by another Algorithm since the general guidelines are the same for each of them, however, you will need to pay attention to the documentation of the resource on your Algofab instance to get familiar with it because, the WFC 2 bellow will probably not work. 
* Make sure you have docker installed.

## Outcome

Having an alforithm locally available to run experiments.


## Workflow Components
																																					
### WFC 1: Download the Algorithm

This algorithm is in actual fact an Algofab resource and, in order to download one of its versions, you need and HTTP request in the following format :
																																																																																																																																																								
<pre>
	GET <@APIServer>/resource/<@GifferID>/version/<@versionID>/download?agreement=agreementVersion&licence=licenceVersion
</pre>

Where _**@APIServer**_ is the base address of the API Server, _**@Giffer**_ is the resource ID of the Algorithm on Algofab and _**@versionID**_ is the version we wish to download. As for the query parameters "agreement" and "licence", they only need to be present in prevision for the future (their values are not checked) because they are not yet implemented.

Therefore, we download the algoritm using the following command:

```bash
$ curl -L --output giffer.tar https://https://ws67-af-portal.tl.teralab-datascience.fr/resource/5eddbccc3f6820007595308f/version/5ecbd0069e260407edd6ebd1/download?agreement&licence
```

_**Note**: This might change in the future when the fields "agreement" and "licence" are properly handled._

After runing the previous command you should see a file name giffer.tar, to extract it type:

```bash
$ tar -xvf giffer.tar
```

Next let us use the Algorithm.

### WFC 2: Run the Algorithm

Here we just need to run a single command on the default images available in the docker image and generate a .gif file, to have a more thourough view of the algorithm read its documentation on .

The command is the following: 

```bash
# Folder to put the generated gif images
$ mkdir output

# run the algorithm
$ docker run -it -v $(pwd)/output:/outputs algofab2018/giffer default demo.gif
```

After run this command, you should see a new folder "gifs" containing the generated gif file called demo.gif.

_**Note**: If you choose another resource (not Giffer), the last command will probably not work for you, in that case you should read the resource's documentation on Algofab._

## Conclusion

You have learned how to download a resource from Algofab and how to run it, so you have successfully resolved the challenge of the nth step of your scientific study use case. 

You can image that this simple use case we preceded and followed by other steps, each resolving part of the main problem discussed in the study. 

Hope this was usefull.

## Automatic Script

This is a script that can allow you to easily and automatically perform the whole workflow. 
You should pay attention to the parameters part of the script to make it adaptable.

```bash

###############################
###### DEFINE PARAMETERS ######
###############################

API_SERVER="https://ws67-af-api.tl.teralab-datascience.fr"

RESOURCE_ID="5eddbccc3f6820007595308f"
RESOURCE_NAME="Giffer"
VERSION_ID="5eddbccc3f6820007595308f"

AGREEMENT=""
LICENCE=""

OUTPUT_FILENAME="demo.gif"



###############################
###### DOWNLOAD RESOURCE ######
###############################

curl -L --output $RESOURCE_NAME.tar $API_SERVER/resource/$RESOURCE_ID/version/$VERSION_ID/download?agreement=$AGREEMENT\&licence=$LICENCE

tar -xvf $RESOURCE_NAME.tar



###############################
######## RUN RESOURCE #########
###############################


# Folder to put the generated gif images
mkdir output

# run the algorithm
docker run -it -v $(pwd)/output:/outputs algofab2018/giffer default demo.gif
```