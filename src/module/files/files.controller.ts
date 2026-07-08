import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from '@/module/files/files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UploadImageDto } from '@/module/files/dto/upload-image.dto';
import { UploadImageResponse } from '@/module/files/type/upload-image-response.type';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * 프로필 이미지 업로드
   * @remarks
   * 이미지 1장(png/jpg/webp, 최대 5MB)을 `multipart/form-data` 의 `file` 필드로 받는다.
   *
   * 업로드 시 아래 4개 객체가 `profile/{YYYY}/{mm}/{uuid}/` 하위에 저장된다.
   * - `origin.webp` : 원본(리사이즈 없이 webp 변환만)
   * - `72.webp` / `60.webp` / `48.webp` : 정사각 cover 크롭 파생본
   *
   * 응답 `url` 은 uuid 까지의 base URL 이며, 실제 이미지는 뒤에 파일명을 붙여 접근한다.
   * 예) `${url}/origin.webp`, `${url}/72.webp`
   * @param file
   */
  @Post('profile-image/upload')
  @Auth(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiResponseSuccess(UploadImageResponse)
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.filesService.uploadProfileImage(file);
  }
}
