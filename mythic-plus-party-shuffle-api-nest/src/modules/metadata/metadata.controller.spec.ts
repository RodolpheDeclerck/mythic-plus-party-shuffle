import { NotFoundException } from '@nestjs/common';
import { MetadataController, ClassesController } from './metadata.controller';
import { CharacterClassDetails } from '../../shared/data/characterClassDetails.data';
import { SpecializationDetails } from '../../shared/data/specializationsDetails.data';

const aClass = Object.keys(CharacterClassDetails)[0] as any;
const aSpec = Object.keys(SpecializationDetails)[0] as any;

describe('MetadataController', () => {
  const controller = new MetadataController();

  it('getClasses lists every class key', () => {
    expect(controller.getClasses()).toEqual(Object.keys(CharacterClassDetails));
  });

  describe('getSpecializations', () => {
    it('returns the specializations of a known class', () => {
      expect(controller.getSpecializations(aClass)).toBe(
        CharacterClassDetails[aClass].specializations,
      );
    });

    it('throws NotFound for an unknown class', () => {
      expect(() => controller.getSpecializations('NOPE' as any)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSpecializationDetails', () => {
    it('returns details for a known specialization', () => {
      expect(controller.getSpecializationDetails(aSpec)).toBe(
        SpecializationDetails[aSpec],
      );
    });

    it('throws NotFound for an unknown specialization', () => {
      expect(() =>
        controller.getSpecializationDetails('NOPE' as any),
      ).toThrow(NotFoundException);
    });
  });
});

describe('ClassesController', () => {
  const controller = new ClassesController();

  it('getClasses lists every class key', () => {
    expect(controller.getClasses()).toEqual(Object.keys(CharacterClassDetails));
  });

  it('getSpecializations throws NotFound for an unknown class', () => {
    expect(() => controller.getSpecializations('NOPE' as any)).toThrow(
      NotFoundException,
    );
  });
});
