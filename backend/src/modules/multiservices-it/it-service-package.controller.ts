import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ITServicePackageService } from './it-service-package.service';
import { CreateServicePackageDto, UpdateServicePackageDto } from './dto/service-package.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('multiservices-it/service-packages')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.MULTISERVICES_IT)
export class ITServicePackageController {
  constructor(private servicePackageService: ITServicePackageService) {}

  @Get()
  async findAll() {
    return this.servicePackageService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicePackageService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateServicePackageDto) {
    return this.servicePackageService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateServicePackageDto) {
    return this.servicePackageService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.servicePackageService.remove(id);
  }
}
