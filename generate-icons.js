const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration des tailles d'icônes pour Expo
const iconSizes = {
  // Icône principale (1024x1024)
  icon: 1024,
  // Icône adaptative Android (foreground)
  adaptiveIcon: 1024,
  // Icône splash
  splash: 1242,
  // Favicon web
  favicon: 48
};

async function generateIcons() {
  const inputPath = path.join(__dirname, 'assets', 'bra_favicon.jpg');
  const outputDir = path.join(__dirname, 'assets');

  try {
    console.log('🔄 Génération des icônes...');

    // Vérifier que le fichier source existe
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Fichier source non trouvé: ${inputPath}`);
    }

    // Générer l'icône principale (1024x1024)
    await sharp(inputPath)
      .resize(iconSizes.icon, iconSizes.icon, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon.png'));

    console.log('✅ icon.png généré (1024x1024)');

    // Générer l'icône adaptative Android (foreground)
    await sharp(inputPath)
      .resize(iconSizes.adaptiveIcon, iconSizes.adaptiveIcon, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'adaptive-icon.png'));

    console.log('✅ adaptive-icon.png généré (1024x1024)');

    // Générer l'icône splash (1242x2436)
    await sharp(inputPath)
      .resize(iconSizes.splash, iconSizes.splash, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'splash-icon.png'));

    console.log('✅ splash-icon.png généré (1242x1242)');

    // Générer le favicon web (48x48)
    await sharp(inputPath)
      .resize(iconSizes.favicon, iconSizes.favicon, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));

    console.log('✅ favicon.png généré (48x48)');

    console.log('🎉 Toutes les icônes ont été générées avec succès !');
    console.log('📁 Fichiers créés dans le dossier assets/ :');
    console.log('   - icon.png (1024x1024)');
    console.log('   - adaptive-icon.png (1024x1024)');
    console.log('   - splash-icon.png (1242x1242)');
    console.log('   - favicon.png (48x48)');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
generateIcons();
