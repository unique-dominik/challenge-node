import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { statSync, createReadStream } from 'fs';

var fs = require('fs');
const os = require('os');

// MIME types
const inputcontenttype = 'video/mp4';
const outputcontenttype = 'video/webm'; // == 'video/x-matroska' from ffmpeg perspective ;
//  output of ffmpeg -formats
//  .E matroska        Matroska
//  D. matroska, webm  Matroska / WebM

// ffmpeg binaries
const ffmpeg = require("fluent-ffmpeg");

//if (process.platform == 'win32') {ffmpeg.setFfmpegPath(join(__dirname, '..', 'assets/ffmpeg.exe'));} 
//if (process.platform == 'linux') {ffmpeg.setFfmpegPath('/snap/bin/ffmpeg')};
ffmpeg.setFfmpegPath(join(__dirname, '..', 'assets/ffmpeg.exe'))
ffmpeg.setFfprobePath(join(__dirname, '..', 'assets'));

// Timer
const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

// Globals
// TODO Get the maximum duration for the videos, not the size...
global.challengeCurrentMaxStream = 10 ** 6; // Init 1M
global.challengeIsAcceptingConnections = true; // Is true while no SIGTERM

/**
 * Convert a file to matroska
 * @param {video} string : The video to be converted
 */
const challengeConvert = (video) => new Promise<void>(resolve => {
    ffmpeg(video)
        .toFormat('matroska')
        .on('end', function () {
            console.log('\tFile converted');
            resolve();
        })
        .save(video + '.mkv')
});

@Injectable()
export class AppService {

    /**
         * Log any challenge action in Log and in Console
         * @param {string} myString : string to log
         */
    challengeLog(myString: string): void {

        console.log(myString);
        myString = new Date().toISOString() + ' ' + myString + '\n';
        fs.appendFile(join(__dirname, '..', 'log/challenge.log'), myString, function (err) {
            if (err) throw err;
        });
    }

    /**
         * Log the challenge globals 
         * 
         */
    challengeLogGlobals(): void {
        console.log(`global.challengeCurrentMaxStream : ${global.challengeCurrentMaxStream}`);
        console.log(`global.challengeIsAcceptingConnections :  ${global.challengeIsAcceptingConnections}`);

    }

    /**
     * Render the index.html page
     * @param {Response} res : Interface response
     */
    challengeIndexPage(res): void {
        if (global.challengeIsAcceptingConnections) {
            res.sendFile(join(__dirname, '..', 'assets/index.html'));
        } else {
            res.sendFile(join(__dirname, '..', 'assets/closed.html'));
        }
    }

    /**
    * Render the video
     * @param {Request} req : Interface request
     * @param {Response} res : Interface response
     * @param {string} video : Temp file name
     */
    challengeStream(req, res, video): void {
        try {
            const range = req.headers.range;
            const videoPath = os.tmpdir() + '/' + video + '.mkv';
            const videoSize = fs.statSync(videoPath).size;
            global.challengeCurrentMaxStream = Math.max(global.challengeCurrentMaxStream, videoSize);

            if ((!range) || range == "bytes=0-1") {
                // The client has no info yet, we send them to put the burden on him
                // Or the client is an ios/android browser and won't use range
                // In both cases, we have to init/sent all file headers to the client
                const head = {
                    "Content-Length": videoSize,
                    "Content-Type": outputcontenttype,
                };
                res.writeHead(200, head);
                createReadStream(videoPath).pipe(res);
                this.challengeLog('\t\tEntire file headers sent');
                this.challengeLog(`\t\tContent-Length :${videoSize}`);
            } else {
                // The client now knows everything about the video and we send him the chunks
                const CHUNK_SIZE = 10 ** 6;
                const start = Number(range.replace(/\D/g, ""));
                const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
                const contentLength = end - start + 1;
                const headers = {
                    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": contentLength,
                    "Content-Type": outputcontenttype,
                };
                res.writeHead(206, headers)
                const videoStream = fs.createReadStream(videoPath, { start, end });
                videoStream.pipe(res);
                this.challengeLog(`\t\tChunk sent: ${range}`);
                if (end == (videoSize - 1)) {
                    // TODO Send status 200 when last chunk is sent
                    this.challengeLog('\t\tLast chunk sent');
                }
            }
        }
        catch (err) {
            // Video doesn't exist
            // throw err;
            this.challengeLog('\t\tError during video streaming');
            res.redirect('/');
        }
    }

    /**
     * Upload the video
     * @param {Request} req : Interface request
     * @param {Response} res : Interface response
     */
    challengeUpload(req, res): void {
        const formidable = require('formidable');
        var form = new formidable.IncomingForm();
        // Let's get the upload
        form.parse(req, async function (err, fields, files) {
            if (err) {
                throw err;
            } else {
                if (files.filetoupload.mimetype == inputcontenttype) {
                    var oldpath = files.filetoupload.filepath;
                    console.log('\tFile uploaded');
                    
                    // We convert the upload
                    // 1) type="video/x-matroska" But which browser will get this ? Seriously, are you serious Dom ?
                    // 2) how are we supposed to stream a flux without saving it somewhere ?
                    await challengeConvert(oldpath);

                    // We redirect to the stream route
                    res.redirect('/stream/' + files.filetoupload.newFilename);

                } else {
                    res.redirect('/');
                    console.log('\tFile non compliant');

                }
            }
        });
    }

    /**
     * Graceful shutdown
     */
    public async beforeApplicationShutdown(signal): Promise<void> {
        console.log({ signal });
        global.challengeIsAcceptingConnections = false;
        var challengetimer = Math.round(global.challengeCurrentMaxStream / 10 ** 6); // We assume streaming @1Mo/s

        for (let i = challengetimer; i > 0; i--) {
            console.log(`Shutting down in ${i}s`);
            await sleep();
        }
    }
}
