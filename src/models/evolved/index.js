import { createOwlForm } from './OwlForm.js';
import { createCatForm } from './CatForm.js';
import { createUnicornForm } from './UnicornForm.js';

const formFactories = {
  owl: createOwlForm,
  cat: createCatForm,
  unicorn: createUnicornForm,
};

/**
 * 根据进化类型创建对应的 3D 宠物模型
 * @param {'owl'|'cat'|'unicorn'} type
 * @returns {THREE.Group}
 */
export function createEvolvedPet(type) {
  const factory = formFactories[type];
  if (!factory) {
    console.warn(`未知进化形态: ${type}，使用默认`);
    return createOwlForm();
  }
  return factory();
}
