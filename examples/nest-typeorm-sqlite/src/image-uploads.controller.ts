import { Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudCreate } from 'crudman-nestjs'

// This controller exposes one POST endpoint per image preset for quick manual testing
@UseCrud({ sections: {} })
@ApiTags('image-uploads')
@Controller('api/demo')
export class ImageUploadsController {
  @Post('upload-image') @CrudCreate('uploads-image') createImage() {}
  @Post('upload-image-jpg') @CrudCreate('uploads-image-jpg') createImageJpg() {}
  @Post('upload-image-png') @CrudCreate('uploads-image-png') createImagePng() {}
  @Post('upload-image-gif') @CrudCreate('uploads-image-gif') createImageGif() {}
  @Post('upload-image-webp') @CrudCreate('uploads-image-webp') createImageWebp() {}
  @Post('upload-image-avif') @CrudCreate('uploads-image-avif') createImageAvif() {}

  @Post('upload-image-avatar') @CrudCreate('uploads-image-avatar') createImageAvatar() {}
  @Post('upload-image-jpg-avatar') @CrudCreate('uploads-image-jpg-avatar') createImageJpgAvatar() {}
  @Post('upload-image-png-avatar') @CrudCreate('uploads-image-png-avatar') createImagePngAvatar() {}
  @Post('upload-image-webp-avatar') @CrudCreate('uploads-image-webp-avatar') createImageWebpAvatar() {}
  @Post('upload-image-avif-avatar') @CrudCreate('uploads-image-avif-avatar') createImageAvifAvatar() {}
}


