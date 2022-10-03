import { Controller, Get, Post, Request, Response, Param} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    /* GET Route */
    @Get()
    renderGet(@Request() req, @Response() res): void {
        this.appService.challengeLog('Challenge streaming service is online');
        this.appService.challengeIndexPage(res);        
    }

    /* POST Route */
    @Post()
    renderPost(@Request() req, @Response() res): void {
        this.appService.challengeLog('\tStreaming requested');
        this.appService.challengeUpload(req, res);        
    }

    /* Streaming route */
    @Get('stream/:video')
    renderStream(@Request() req, @Response() res, @Param('video') video: string): void {
        this.appService.challengeLog('\tStreaming video ' + video);
        this.appService.challengeStream(req, res, video);
    }
}
