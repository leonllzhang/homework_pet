import * as THREE from 'three';

/**
 * 悬浮书架 — 维多利亚风格，带上下浮动动画
 */
export function createBookshelf(x, y, z, rotationY = 0, shelves = 3) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotationY;

  const woodColor = 0x3D2B1F;
  const bookColors = [
    0x8B0000, 0x1B4D3E, 0x2C3E6B,
    0x6B2C3E, 0x4A6FA5, 0xB8860B,
    0x2F4F4F, 0x8B4513,
  ];

  const shelfHeight = 1.6;
  const shelfWidth = 2.4;
  const shelfDepth = 0.6;
  const shelfThickness = 0.06;

  // 左右立柱
  const pillarMat = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.8,
    metalness: 0.1,
  });

  for (let side = -1; side <= 1; side += 2) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, shelfHeight, 0.08),
      pillarMat
    );
    pillar.position.set(side * (shelfWidth / 2 - 0.04), 0, 0);
    group.add(pillar);
  }

  // 层板 + 书籍
  const shelfMat = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.7,
    metalness: 0.1,
  });

  for (let s = 0; s < shelves; s++) {
    const sy = -shelfHeight / 2 + (s + 0.5) * (shelfHeight / shelves);

    // 层板
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth),
      shelfMat
    );
    plank.position.set(0, sy, 0);
    group.add(plank);

    // 书籍排列
    const booksPerShelf = 4 + Math.floor(Math.random() * 3);
    const bookSpacing = (shelfWidth - 0.3) / booksPerShelf;
    const bookStart = -shelfWidth / 2 + 0.15;

    for (let b = 0; b < booksPerShelf; b++) {
      const color = bookColors[(s * 7 + b * 3) % bookColors.length];
      const bookW = 0.06 + Math.random() * 0.06;
      const bookH = 0.2 + Math.random() * 0.25;
      const bookD = 0.35 + Math.random() * 0.1;
      const tilt = (Math.random() - 0.5) * 0.06;

      const bookMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.2,
      });

      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bookW, bookH, bookD),
        bookMat
      );
      book.position.set(
        bookStart + b * bookSpacing,
        sy + shelfThickness / 2 + bookH / 2,
        (Math.random() - 0.5) * 0.04
      );
      book.rotation.z = tilt;
      group.add(book);

      // 金色书脊装饰
      if (Math.random() > 0.5) {
        const spineMat = new THREE.MeshStandardMaterial({
          color: 0xC9A84C,
          emissive: 0xC9A84C,
          emissiveIntensity: 0.1,
        });
        const spine = new THREE.Mesh(
          new THREE.BoxGeometry(bookW * 1.1, bookH * 0.1, 0.01),
          spineMat
        );
        spine.position.copy(book.position);
        spine.position.z += bookD / 2 + 0.005;
        group.add(spine);
      }
    }
  }

  // 顶部装饰楣
  const corniceMat = new THREE.MeshStandardMaterial({
    color: 0xC9A84C,
    roughness: 0.3,
    metalness: 0.7,
  });
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth + 0.1, 0.04, shelfDepth + 0.05),
    corniceMat
  );
  cornice.position.set(0, shelfHeight / 2, 0);
  group.add(cornice);

  // 存储动画数据
  group.userData = {
    floatAmplitude: 0.06 + Math.random() * 0.04,
    floatSpeed: 0.3 + Math.random() * 0.2,
    floatPhase: Math.random() * Math.PI * 2,
    baseY: y,
    rotSpeed: 0.05 + Math.random() * 0.03,
  };

  return group;
}

/**
 * 更新所有书架浮动动画
 */
export function updateBookshelves(bookshelves, time) {
  bookshelves.forEach((shelf) => {
    const { floatAmplitude, floatSpeed, floatPhase, baseY } = shelf.userData;
    shelf.position.y = baseY + Math.sin(time * floatSpeed + floatPhase) * floatAmplitude;
    shelf.rotation.z = Math.sin(time * floatSpeed * 0.5 + floatPhase) * 0.008;
  });
}
