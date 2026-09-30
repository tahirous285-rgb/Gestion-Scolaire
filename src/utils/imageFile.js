const MAX_SIDE = 480;
const JPEG_QUALITY = 0.72;

export function isDisplayablePhoto(value) {
  if (!value) return false;
  return /^(https?:|data:|\/storage\/)/i.test(String(value).trim());
}

export function photoUrl(value) {
  if (!isDisplayablePhoto(value)) return "";
  return String(value).trim();
}

/** Lit un fichier image de l’explorateur, le redimensionne et le convertit
 *  en data URL JPEG. La valeur est enregistrée dans le dossier élève. */
export function fileToStoredPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Choisissez un fichier image (JPG, PNG, WebP…)."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("La photo ne doit pas dépasser 8 Mo."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      image.onerror = () => reject(new Error("Fichier image illisible."));
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
