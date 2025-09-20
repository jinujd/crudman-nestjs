import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { UploadDemo } from './upload-demo.entity'

@UseCrud({ sections: {
  // Images
  'uploads-image': { model: UploadDemo, uploadable: { file: 'image' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-jpg': { model: UploadDemo, uploadable: { file: 'image-jpg' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-png': { model: UploadDemo, uploadable: { file: 'image-png' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-gif': { model: UploadDemo, uploadable: { file: 'image-gif' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-webp': { model: UploadDemo, uploadable: { file: 'image-webp' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-avif': { model: UploadDemo, uploadable: { file: 'image-avif' }, uploadDefaults: { storage: 'local' } },
  'uploads-image-avatar': { model: UploadDemo, uploadable: { file: 'image-avatar' }, uploadDefaults: { storage: 'local' } },

  // Video
  'uploads-video': { model: UploadDemo, uploadable: { file: 'video' }, uploadDefaults: { storage: 'local' } },
  'uploads-video-mp4': { model: UploadDemo, uploadable: { file: 'video-mp4' }, uploadDefaults: { storage: 'local' } },
  'uploads-video-webm': { model: UploadDemo, uploadable: { file: 'video-webm' }, uploadDefaults: { storage: 'local' } },
  'uploads-video-ogg': { model: UploadDemo, uploadable: { file: 'video-ogg' }, uploadDefaults: { storage: 'local' } },
  'uploads-video-short': { model: UploadDemo, uploadable: { file: 'video-short' }, uploadDefaults: { storage: 'local' } },

  // Docs & text
  'uploads-pdf': { model: UploadDemo, uploadable: { file: 'pdf' }, uploadDefaults: { storage: 'local' } },
  'uploads-doc': { model: UploadDemo, uploadable: { file: 'doc' }, uploadDefaults: { storage: 'local' } },
  'uploads-text': { model: UploadDemo, uploadable: { file: 'text' }, uploadDefaults: { storage: 'local' } },
  'uploads-xml': { model: UploadDemo, uploadable: { file: 'xml' }, uploadDefaults: { storage: 'local' } },
  'uploads-html': { model: UploadDemo, uploadable: { file: 'html' }, uploadDefaults: { storage: 'local' } },
  'uploads-json': { model: UploadDemo, uploadable: { file: 'json' }, uploadDefaults: { storage: 'local' } },

  // Spreadsheets
  'uploads-spreadsheet': { model: UploadDemo, uploadable: { file: 'spreadsheet' }, uploadDefaults: { storage: 'local' } },
  'uploads-spreadsheet-csv': { model: UploadDemo, uploadable: { file: 'spreadsheet-csv' }, uploadDefaults: { storage: 'local' } },
  'uploads-spreadsheet-xls': { model: UploadDemo, uploadable: { file: 'spreadsheet-xls' }, uploadDefaults: { storage: 'local' } },
  'uploads-spreadsheet-xlsx': { model: UploadDemo, uploadable: { file: 'spreadsheet-xlsx' }, uploadDefaults: { storage: 'local' } },

  // Archive/binary
  'uploads-archive': { model: UploadDemo, uploadable: { file: 'archive' }, uploadDefaults: { storage: 'local' } },
  'uploads-binary': { model: UploadDemo, uploadable: { file: 'binary' }, uploadDefaults: { storage: 'local' } },
}})
@ApiTags('file-uploads')
@Controller('api')
export class FileUploadsController extends CrudControllerBase([
  'uploads-image','uploads-image-jpg','uploads-image-png','uploads-image-gif','uploads-image-webp','uploads-image-avif','uploads-image-avatar',
  'uploads-video','uploads-video-mp4','uploads-video-webm','uploads-video-ogg','uploads-video-short',
  'uploads-pdf','uploads-doc','uploads-text','uploads-xml','uploads-html','uploads-json',
  'uploads-spreadsheet','uploads-spreadsheet-csv','uploads-spreadsheet-xls','uploads-spreadsheet-xlsx',
  'uploads-archive','uploads-binary'
]) {}


