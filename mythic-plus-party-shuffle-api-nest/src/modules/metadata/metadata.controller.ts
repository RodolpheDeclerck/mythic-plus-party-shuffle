import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SpecializationDetails } from '../../shared/data/specializationsDetails.data';
import { CharacterClassDetails } from '../../shared/data/characterClassDetails.data';
import { CharacterClass, Specialization } from '@prisma/client';

@Controller('api/metadata')
export class MetadataController {
  @Get('classes')
  getClasses() {
    return Object.keys(CharacterClassDetails);
  }

  @Get('specializations/:characterClass')
  getSpecializations(@Param('characterClass') characterClass: CharacterClass) {
    const specializations = CharacterClassDetails[characterClass]?.specializations;

    if (!specializations) {
      throw new NotFoundException('Class not found');
    }

    return specializations;
  }

  @Get('specialization-details/:specialization')
  getSpecializationDetails(@Param('specialization') specialization: Specialization) {
    const details = SpecializationDetails[specialization];

    if (!details) {
      throw new NotFoundException('Specialization not found');
    }

    return details;
  }
}

// Contrôleur séparé pour /api/classes (compatibilité)
@Controller('api')
export class ClassesController {
  @Get('classes')
  getClasses() {
    return Object.keys(CharacterClassDetails);
  }

  @Get('specializations/:characterClass')
  getSpecializations(@Param('characterClass') characterClass: CharacterClass) {
    const specializations = CharacterClassDetails[characterClass]?.specializations;

    if (!specializations) {
      throw new NotFoundException('Class not found');
    }

    return specializations;
  }
}