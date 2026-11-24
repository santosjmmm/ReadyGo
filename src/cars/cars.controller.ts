import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectDisk, serveFile, StorageDisk, uploadToDisk, type StoredUpload } from '@nestjs/storage';
import type { Request, Response } from 'express';
import { CarsService } from './cars.service.js';
import { CreateCarDto } from './dto/create-car.dto.js';

const MAX_CAR_IMAGE_SIZE = 5 * 1024 * 1024;
const CAR_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    @InjectDisk('car-photos') private readonly carPhotos: StorageDisk,
  ) {}

  @Get()
  findAll() {
    return this.carsService.findAll();
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: uploadToDisk({
        disk: 'car-photos',
        contentTypes: CAR_IMAGE_TYPES,
        cacheControl: 'public, max-age=31536000, immutable',
      }),
      limits: { fileSize: MAX_CAR_IMAGE_SIZE, files: 1 },
    }),
  )
  uploadImage(@UploadedFile() file: StoredUpload | undefined) {
    if (!file) {
      throw new BadRequestException('Attach an image using the "image" field');
    }

    return { url: this.carPhotos.url(file.key) };
  }

  @Get('images/:file')
  serveImage(
    @Param('file') file: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return serveFile(this.carPhotos, file, {
      req: request,
      res: response,
      disposition: 'inline',
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCarDto) {
    return this.carsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCarDto>) {
    return this.carsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.remove(id);
  }
}
