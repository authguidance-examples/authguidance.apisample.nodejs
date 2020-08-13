# authguidance.apisample.nodejs

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/authguidance.apisample.nodejs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/authguidance.apisample.nodejs?targetFile=package.json)

### Overview

* The final API code sample using OAuth 2.0 and Open Id Connect, referenced in my blog at https://authguidance.com
* **The goal of this sample is to implement the blog's** [API Architecture](https://authguidance.com/2019/03/24/api-platform-design/) **in NodeJS**

### Details

* See the [Overview Page](https://authguidance.com/2017/10/27/api-architecture-node) for what the API does and how to run it
* See the [Coding Key Points Page](https://authguidance.com/2017/10/27/final-nodeapi-coding-key-points/) for further technical details

### Programming Languages

* NodeJS with TypeScript is used for the API

### Middleware Used

* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used for API OAuth operations
* The [Node Cache](https://github.com/mpneuried/nodecache) is used to cache API claims in memory
* Express is used to host the API
* [Inversify](http://inversify.io) is used to manage dependencies in line with other development languages
* Okta is used for the Authorization Server
* OpenSSL is used for SSL certificate handling
* API logs can be aggregated to [Elastic Search](https://authguidance.com/2019/07/19/log-aggregation-setup/) to support common [Query Use Cases](https://authguidance.com/2019/08/02/intelligent-api-platform-analysis/)
