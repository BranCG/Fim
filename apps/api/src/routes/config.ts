import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/public', async (_req: Request, res: Response) => {
  try {
    const keys = ['promo_ribbon_enabled', 'promo_ribbon_text_driver', 'promo_ribbon_text_passenger'];
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });
    const configMap = configs.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return res.json({ config: configMap });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener configuraciones públicas' });
  }
});

export default router;
