import { Controller, Get, Param, Res } from '@nestjs/common';
import { type Response } from 'express';
import { join } from 'path';

@Controller('webpage')
export class WebpageController {
  @Get(':fileName')
  getFile(@Param('fileName') fileName: string, @Res() res: Response) {
    res.sendFile(fileName, { root: join(process.cwd(), 'public') }, (err) => {
      if (!err) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.status(404).send('파일 없음');
    });
  }
}
