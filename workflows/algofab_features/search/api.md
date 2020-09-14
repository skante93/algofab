# Algofab features: Search on API

## Outcome 
* Being able to perform searches on the API

## Pre-requisites

* Signin up on Algofab

## Instructions 

_Note: If you haven't signed up on Algofab yet, please [do so]() before proceeding further._


To perform a search, send a GET request to the /resource/search url or the API Server with the text being searched a query parameter named **q**.

*__About searches__: when performing searches the text (query parameter __q__) can be formatted as you would do in google search engine (i.e. with keywords such as AND, OR, with minus ...). The search will be applied on the following fields of the database documents: __name__, __description__ and __tags__. Hence be sure to make those fields as self explanatory as possible when you [create resources]()*

You can filter the results by using the following query parameters:
* name: a regex to filter out name to do not match the given name
* tag: a string to filter out tags where neither key nor value equals the given tag
* type: a string to filter out all resource that do not match the given type.

### Examples: 

* to search the text "python" on the resources, you can type the following: 

```bash
curl -X GET https://[adress API Server]/resource/search?q=python
```

* to search the text "python OR java" (searching resources where either the words python or java exists) on the resources, you can type the following: 

```bash
curl -X GET https://[adress API Server]/resource/search?q=python+OR+java
```

* to search the text "python" and only get the "notebook" type of resources :

```bash
curl -X GET https://[adress API Server]/resource/search?q=python&type=notebook
```

### Response

If respone statsus code is :
* __200__: the search was successfull
* __otherwise__: there was an error. 


