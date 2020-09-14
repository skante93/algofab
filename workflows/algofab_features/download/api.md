
# Algofab features: Download & Run through API

## Context

This workflow shows how to download and run resources Algofab through the API server.

## Outcome

* Being able to download and run Algofab resources through the API server . 

## Pre-requisites

* Signin up on Algofab
* Accepting the Licence and Terms of use precised by the resource maintainer.

## Instructions

### Download

To download a resource type, this is how:

```bash
curl -X GET https://[address of API Server]/resources/[id resource]?accept_licence=true&accept_terms_of_use=true --output resource.zip
```

Where : 
* __[adresse of API Server]__ : is the adress of the API server
* __[id resource]__ : is the ID of the resource to be downloaded
* __accept_licence__ : required query parameter to make users remember that there is a licence to read and agree to. If its value is not true, the download fails.
* __accept_licence__ : required query parameter to make users remember that there is a terms of use to read and agree to. If its value is not true, the download fails.

_Note: we saved the response as resource.zip, this will work only if the original archive uploaded byt the resource's maintainer was a zip file. To know what kind of format to expect you can [query the API Server about the resource's information]() and learn the extension of the archive (field XXX)._

### Response

If respone statsus code is :
<!-- * <span style="color:green">200</span> : the download was successfull -->
* __200__: the download was successfull
* __otherwise__: there was an error. 


### Run

The running method will be different for each resource, to understand how to make use of a resource you need to read its documentation first and then conform to it to obtain the expected benefit.

As such, the running will depend on developper's understanding of the resource's documentation. 