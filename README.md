  <p align="center">A small Node.js service, streaming any mp4 file to a mkv file</p>
    <p align="center">
<a href="#"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
</p>

## Description

- Upload any compliant file (video/mp4) to the service and it is converted  (video/x-matroska aka video/webm) 
- Graceful shutdown of the server when SIGTERM
- Detailled logging

TODO : Containerize<br/>

## Blockers
- Docker desktop failing to start on my Windows installation => Could unfortunately not create docker image
- Switched to Linux installation, docker working, challenge service starting but ffmpeg libraries return error about mastroka output not available, despite being there

## Unblockers
- Continue T/S of ffmpeg on Linux
- Then create docker image on Linux
- Upload image to a repo

## Working dir
- ${your_web_folder}/challenge

## Sources
- ${your_web_folder}/challenge/src

## Installation

```bash
$ npm install
```

## Running the app

```bash
$ nest start --watch
```

## Test

```bash
# e2e tests
$ npm run test:e2e
```

## Support

No support

## Stay in touch

- Author - eric@adaire.ch

## License

NO LICENSE

## Live demo
- Service Landing Page : http://20.41.121.155:3000/
- Streaming sample : Try uploading the small video https://github.com/ericadaire/challenge-node/blob/master/testbyuploadingthis.mp4 and you should be redirected to a streaming link like http://20.41.121.155:3000/stream/idxxxxxxxxxxxxxxxxxxxxx
