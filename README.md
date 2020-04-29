<h1 align="center">
<br>
  <img src="https://assets.berty.tech/files/v2--yolo.svg" alt="Yolo - The Berty Project" height="150px">
  <br>
</h1>

<h3 align="center">Yolo is an over-the-air installation distributor for your mobile applications</h3>

<p align="center">
    <a href="https://berty.tech"><img alt="berty.tech" src="https://img.shields.io/badge/berty.tech-2845a7?logo=internet-explorer&style=flat" /></a>
    <a href="https://crpt.fyi/berty-discord"><img alt="discord" src="https://img.shields.io/badge/discord-gray?logo=discord" /></a>
    <a href="https://github.com/berty"><img alt="github" src="https://img.shields.io/badge/@berty-471961?logo=github" /></a>
    <a href="https://twitter.com/berty"><img alt="twitter" src="https://img.shields.io/twitter/follow/berty?label=%40berty&style=flat&logo=twitter" /></a>
</p>

> Multi-platform over-the-air installation aggregator (a TestFlight alternative).

Yolo is one-stop realtime feed of ready-to-install releases and tests for your apps. We're using it at [berty](https://github.com/berty) to make releases and test branches ready to download and use on a developer's device within minutes after passing our CI.

We created Yolo to implement the critical features missing from Apple's TestFlight.

| Need                                                                       | TestFlight                                        | Yolo                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Generate artifacts for one build for multiple platforms (e.g iOS, Android) | Write manual custom scripts                       | Default CI tool aggregator                                                                                  |
| Writing documentation                                                      | Write instructions for each platform              | One universal doc                                                                                           |
| Accessing artifacts across platforms                                       | Use a separate tool per OS                        | Single aggregated feed                                                                                      |
| Speedy certificate validation                                              | Run from scratch on eachpublication (~30 minutes) | In-house certificate and signature (~1 minute)                                                              |
| Generate artifacts at any stage of deployment                              | Stable releases only                              | Deeply customizable: Merges to master, pending pull requests, specific tags... anything that passes the CI! |

## Install

`go get -u berty.tech/yolo`

## Getting started

### Usage

If you're authorized, you can request and filter artifacts from the web interface at https://yolo.berty.io.

[TODO: API usage]

### Troubleshooting

[TODO]

## Development

[TODO]

### Architecture

[TODO]

#### Other Resources

-   UI style and asset specifications on HackMD [here](https://hackmd.io/@berty/H1fZ9D_PU)
-   Sketch templates [here](https://assets.berty.tech/categories/yolo__v2/)

## Contributing

![Contribute to Berty](https://assets.berty.tech/files/contribute--small.gif)

🚧 This beta release is currently configured for our internal projects, but we welcome you to fork our repository to customize it for your own use.

If you want to help out, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

This repository falls under the Berty [Code of Conduct](https://github.com/berty/community/blob/master/CODE_OF_CONDUCT.md).

You can contact us on the `dev-💻` channel on [discord](https://crpt.fyi/berty-discord).


#### License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) + [MIT license](https://opensource.org/licenses/MIT). See the [LICENSE.md](LICENSE.md) file for more details.
