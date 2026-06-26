import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = Router();

// Crear carpeta de uploads si no existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/heic', 'image/heif', 'application/pdf',
    'application/octet-stream' // Algunas veces los móviles envían este tipo
  ];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    // Para depuración si sigue fallando
    console.warn(`[Upload] Mimetype bloqueado: ${file.mimetype}`);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max para fotos de alta resolución
});

// ─── SUBIR UN ARCHIVO ─────────────────────────────────────────────────────
router.post('/single', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió archivo' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host || 'localhost:3001';
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl, filename: req.file.filename });
});

// ─── SUBIR MÚLTIPLES ARCHIVOS ─────────────────────────────────────────────
router.post('/multiple', upload.array('files', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se recibieron archivos' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host || 'localhost:3001';

  const urls = files.map(f => ({
    url: `${protocol}://${host}/uploads/${f.filename}`,
    filename: f.filename,
    originalname: f.originalname,
  }));

  return res.json({ files: urls });
});

export default router;
