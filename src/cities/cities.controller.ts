import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CitiesService } from './cities.service';
import { CitySearchDto } from './dto';

@Controller()
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @MessagePattern('catalog.city.search')
  search(@Payload() dto: CitySearchDto) {
    return this.citiesService.search(dto);
  }

  @MessagePattern('catalog.city.findCountries')
  findCountries() {
    return this.citiesService.findCountries();
  }
}
