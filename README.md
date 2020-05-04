<h1 align="center">
<br>
  <img src="https://assets.berty.tech/files/v2--yolo.svg" alt="Yolo - The Berty Project" height="150px">
  <br>
</h1>

<h3 align="center">Yolo is an over-the-air installation distributor for your mobile applications</h3>

<p align="center">
    <a href="https://berty.tech"><img alt="Made by Berty Technologies" src="https://assets.berty.tech/files/badge--10.svg" /></a>
    <a href="https://crpt.fyi/berty-discord"><img alt="discord" src="https://img.shields.io/badge/discord-gray?logo=discord" /></a>
    <a href="https://github.com/berty"><img alt="github" src="https://img.shields.io/badge/@berty-471961?logo=github" /></a>
    <a href="https://twitter.com/berty"><img alt="twitter" src="https://img.shields.io/twitter/follow/berty?label=%40berty&style=flat&logo=twitter" /></a>
    <a href="https://pkg.go.dev/berty.tech/yolo/v2?tab=subdirectories"><img alt="go.dev reference" src="https://img.shields.io/badge/go.dev-reference-007d9c?logo=go&logoColor=white" /></a>
    <a href="https://github.com/berty/yolo/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/berty/yolo" /></a>

</p>

> Multi-platform over-the-air installation aggregator (a TestFlight alternative).

## Philosophy

Mobile app development workflows should be as free as possible from corporate ecosystem constraints.

## Introduction

Yolo is one-stop realtime feed of ready-to-install releases and tests for your apps. We're using it at [berty](https://github.com/berty) to make releases and test branches ready to download and use on a developer's device within minutes after passing our CI.

We created Yolo to implement the critical features missing from Apple's TestFlight.

| Need                                                                       | TestFlight                                        | Yolo                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Generate artifacts for one build for multiple platforms (e.g iOS, Android) | Write manual custom scripts                       | Default CI tool aggregator                                                                                  |
| Writing documentation                                                      | Write instructions for each platform              | One universal doc                                                                                           |
| Accessing artifacts across platforms                                       | Use a separate tool per OS                        | Single aggregated feed                                                                                      |
| Speedy certificate validation                                              | Run from scratch on eachpublication (~30 minutes) | In-house certificate and signature (~1 minute)                                                              |
| Generate artifacts at any stage of deployment                              | Stable releases only                              | Deeply customizable: Merges to master, pending pull requests, specific tags... anything that passes the CI! |

## Getting started

### Official Berty's instance

Nothing to install, using a browser, you can list and download the last builds of applications of the Berty ecosystem.

You just need to have credentials provided by the Berty team and go to https://yolo.berty.io.

_Note that all the available credentials won't give you access to the same application set._

### Call the official API

Using the same credentials you can make direct calls to the API, available here: https://yolo.berty.io/api/.

The API is described in protobuf-format here: https://github.com/berty/yolo/blob/master/api/yolopb.proto.

```console
# last build for the berty app for iOS
$ curl -su :TOKEN "https://yolo.berty.io/api/build-list?project_id=https://github.com/berty/berty&artifact_kinds=1" | jq '.builds[0]'
{
  "id": "https://buildkite.com/berty/berty-open/builds/535",
  "created_at": "2020-04-29T15:06:33.796Z",
  "state": "Passed",
  "message": "feat: add multipeer connectivity Transport and add it in libp2p\n\nfeat: add multipeer connectivity for mobile devices\n\nfix: fix linux compilation failed\n\nchore: remove old references to BLE\n\nchore: remove xcode project directory\n\nchore: goimports passed\n\nfeat: pass functional logger to the mc transport\n\nchore: improve log message in the mc driver",
  "started_at": "2020-04-29T15:45:14Z",
  "finished_at": "2020-04-29T15:58:41Z",
  "branch": "D4ryl00:feat/multipeer-connectivity-integration",
  "driver": "Buildkite",
  "short_id": "535",
  "has_artifacts": [
    {
      "id": "buildkite_524ced1e072c6bb74e3bf9556854b339",
      "created_at": "2020-04-29T15:06:33.796Z",
      "file_size": "38838861",
      "local_path": "Berty-Yolo-08a8bb0dee9935ab14e62648c6969cd5dfd9f517.ipa",
      "download_url": "https://api.buildkite.com/v2/organizations/berty/pipelines/berty-open/builds/535/jobs/323605e5-72fd-4495-8198-615a68672148/artifacts/16bab990-66ee-4ed5-a9d4-db69704bc0fd/download",
      "mime_type": "application/octet-stream",
      "state": "Finished",
      "kind": "IPA",
      "driver": "Buildkite",
      "has_build_id": "https://buildkite.com/berty/berty-open/builds/535",
      "dl_artifact_signed_url": "/api/artifact-dl/buildkite_524ced1e072c6bb74e3bf9556854b339?sign=REDACTED",
      "plist_signed_url": "%2Fapi%2Fplist-gen%2Fbuildkite_524ced1e072c6bb74e3bf9556854b339.plist%3Fsign%3DREDACTED"
    }
  ],
  "has_commit_id": "08a8bb0dee9935ab14e62648c6969cd5dfd9f517",
  "has_project": {
    "id": "https://github.com/berty/berty",
    "created_at": "2018-07-16T05:21:19Z",
    "updated_at": "2020-04-29T13:13:05Z",
    "driver": "GitHub",
    "name": "berty",
    "description": "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
    "has_owner": {
      "id": "https://github.com/berty",
      "name": "berty",
      "driver": "GitHub",
      "avatar_url": "https://avatars1.githubusercontent.com/u/22157871?v=4",
      "kind": "Organization"
    },
    "has_owner_id": "https://github.com/berty"
  },
  "has_project_id": "https://github.com/berty/berty",
  "has_mergerequest": {
    "id": "https://github.com/berty/berty/pull/1908",
    "created_at": "2020-04-23T08:19:28Z",
    "updated_at": "2020-04-30T09:54:59Z",
    "title": "WIP feat: add the multipeer connectivity transport",
    "message": "Add the multipeer connectivity transport of berty v1 to the master branch of berty\r\n* [x] add the transport + driver in an internal package\r\n* [ ] switch on/off that transport from the front",
    "driver": "GitHub",
    "branch": "D4ryl00:feat/multipeer-connectivity-integration",
    "state": "Opened",
    "commit_url": "https://github.com/berty/berty/commit/5face40d919f102d9d0f2b19061bae666f4b940a",
    "short_id": "1908",
    "has_project": {
      "id": "https://github.com/berty/berty",
      "created_at": "2018-07-16T05:21:19Z",
      "updated_at": "2020-04-29T13:13:05Z",
      "driver": "GitHub",
      "name": "berty",
      "description": "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
      "has_owner_id": "https://github.com/berty"
    },
    "has_project_id": "https://github.com/berty/berty",
    "has_author": {
      "id": "https://github.com/D4ryl00",
      "name": "D4ryl00",
      "driver": "GitHub",
      "avatar_url": "https://avatars3.githubusercontent.com/u/13605410?v=4",
      "kind": "User"
    },
    "has_author_id": "https://github.com/D4ryl00",
    "has_commit_id": "08a8bb0dee9935ab14e62648c6969cd5dfd9f517"
  },
  "has_mergerequest_id": "https://github.com/berty/berty/pull/1908"
}
```

## Run your own instance of Yolo

You will need to get multiple CI tokens to allow Yolo to fetch your last builds.

### Install

`go get -u berty.tech/yolo/v2/go/cmd/yolo`

Or grab the last Docker image available [on the official Docker Registry]().

You can start from the official deployment configuration available in [./deployments/yolo.berty.io](deployments/yolo.berty.io/docker-compose.yml).

### CLI usage

```console
$ yolo -h
USAGE
  server [flags] <subcommand>

SUBCOMMANDS
  server        Start a Yolo Server
  dump-objects
  info

FLAGS
  -v false  increase log verbosity
```

```console
$ yolo server -h
USAGE
  server

FLAGS
  -auth-salt ...             salt used to generate authentication tokens at the end of the URLs
  -basic-auth-password ...   if set, enables basic authentication
  -bearer-secretkey ...      optional Bearer.sh Secret Key
  -bintray-token ...         Bintray API Token
  -bintray-username ...      Bintray username
  -buildkite-token ...       BuildKite API Token
  -circleci-token ...        CircleCI API Token
  -cors-allowed-origins ...  CORS allowed origins (*.domain.tld)
  -db-path :temp:            DB Store path
  -dev-mode false            enable insecure helpers
  -github-token ...          GitHub API Token
  -grpc-bind :9000           gRPC bind address
  -http-bind :8000           HTTP bind address
  -max-builds 100            maximum builds to fetch from external services (pagination)
  -realm Yolo                authentication Realm
  -request-timeout 5s        request timeout
  -shutdown-timeout 6s       server shutdown timeout
  -with-cache false          enable API caching
```

### Troubleshooting

[TODO] _(please use [issues](https://github.com/berty/yolo))_

## Development

[TODO]

### Architecture

[TODO]

#### Other Resources

-   UI style and asset specifications on HackMD [here](https://hackmd.io/@berty/H1fZ9D_PU)
-   Sketch templates [here](https://assets.berty.tech/categories/yolo__v2/)

## Contributing

[![Contribute to Berty](https://assets.berty.tech/files/contribute--small.gif)](https://github.com/berty/community)

🚧 This beta release is currently configured for our internal projects, but we welcome you to fork our repository to customize it for your own use.

If you want to help out, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

This repository falls under the Berty [Code of Conduct](https://github.com/berty/community/blob/master/CODE_OF_CONDUCT.md).

You can contact us on the [`#dev-💻`](https://crpt.fyi/berty-dev-discord) channel on [discord](https://crpt.fyi/berty-discord).

## License

Dual-licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) and [MIT](https://opensource.org/licenses/MIT) terms.

See the [COPYRIGHT](./COPYRIGHT) file for more details.
