const MAX_SIDE = 480;
const JPEG_QUALITY = 0.72;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/x-png",
  "image/jpg",
]);
const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp"]);
export const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp";

export function isDisplayablePhoto(value) {
  if (!value) return false;
  const photo = String(value).trim();
  return /^https?:\/\//i.test(photo)
    || /^data:image\//i.test(photo)
    || photo.startsWith("/storage/");
}

export function photoUrl(value) {
  if (!isDisplayablePhoto(value)) return "";
  return String(value).trim();
}

function fileExtension(file) {
  const name = String(file?.name || "");
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * Lit une photo locale, la réduit et renvoie une data URL JPEG durable pour le
 * champ chaîne `photo` de l’API. Aucun Blob URL ni chemin storage n’est créé.
 */
export function fileToStoredPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Choisissez une photo à importer."));
      return;
    }
    if (file.size <= 0) {
      reject(new Error("Le fichier photo est vide."));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("La photo ne doit pas dépasser 8 Mo."));
      return;
    }

    const mimeType = String(file.type || "").toLowerCase();
    const extension = fileExtension(file);
    const supported = mimeType
      ? SUPPORTED_MIME_TYPES.has(mimeType)
      : SUPPORTED_EXTENSIONS.has(extension);
    if (!supported) {
      reject(new Error("Format non pris en charge. Choisissez une photo JPG, PNG, WebP, GIF ou BMP (8 Mo maximum)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier photo."));
    reader.onabort = () => reject(new Error("La lecture du fichier photo a été interrompue."));
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.startsWith("data:image/")) {
        reject(new Error("Le fichier sélectionné n’est pas une image lisible."));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error("Fichier image illisible ou format non pris en charge par ce navigateur."));
      image.onload = () => {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        if (!sourceWidth || !sourceHeight) {
          reject(new Error("Les dimensions de la photo sont invalides."));
          return;
        }

        const scale = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Le navigateur ne peut pas traiter cette photo."));
          return;
        }

        try {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          const storedValue = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          if (!storedValue.startsWith("data:image/jpeg;base64,")) {
            throw new Error("Conversion JPEG non disponible.");
          }
          resolve(storedValue);
        } catch {
          reject(new Error("Impossible de convertir la photo. Essayez un fichier JPG, PNG ou WebP."));
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
