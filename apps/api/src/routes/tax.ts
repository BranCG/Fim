import { Router } from 'express';
import multer from 'multer';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuración de Multer para subir PDFs
const uploadDir = path.join(process.cwd(), 'uploads', 'taxes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.driverId}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ─── RUTAS DE CUMPLIMIENTO TRIBUTARIO ──────────────────────────────────────────

// Subir Boleta de Honorarios
router.post('/upload', upload.single('taxDocument'), async (req, res) => {
  try {
    const { driverId, month, year, amount } = req.body;
    if (!driverId || !req.file) {
      return res.status(400).json({ error: 'Faltan datos o archivo' });
    }

    const fileUrl = `/uploads/taxes/${req.file.filename}`;

    const doc = await prisma.taxDocument.create({
      data: {
        driverId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        amount: parseInt(amount, 10),
        fileUrl,
        status: 'pending'
      }
    });

    res.json({ success: true, document: doc });
  } catch (error) {
    console.error('Error subiendo documento:', error);
    res.status(500).json({ error: 'Error interno al subir documento' });
  }
});

// Obtener documentos de un conductor
router.get('/driver/:id', async (req, res) => {
  try {
    const documents = await prisma.taxDocument.findMany({
      where: { driverId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo documentos' });
  }
});

// (Admin) Aprobar o Rechazar documento
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await prisma.taxDocument.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando documento' });
  }
});

export default router;
