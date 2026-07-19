import { RekognitionClient, CompareFacesCommand, DetectTextCommand } from "@aws-sdk/client-rekognition";

const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || "us-east-1";

let rekognitionClient: RekognitionClient | null = null;

if (awsAccessKeyId && awsSecretAccessKey) {
  console.log("ℹ️ [Rekognition] Inicializando cliente con credenciales de AWS");
  rekognitionClient = new RekognitionClient({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });
} else {
  console.warn("⚠️ [Rekognition] Credenciales de AWS no detectadas en .env. La comparación facial correrá en MOCK (simulado).");
}

/**
 * Compara dos imágenes (en formato Buffer) utilizando AWS Rekognition
 * @param sourceBuffer Imagen de perfil/referencia oficial
 * @param targetBuffer Selfie en tiempo real capturada por el cliente
 * @returns El porcentaje de similitud entre ambos rostros (0 - 100)
 */
export async function compareFaces(sourceBuffer: Buffer, targetBuffer: Buffer): Promise<number> {
  if (!rekognitionClient) {
    console.log("ℹ️ [Rekognition] Simulando comparación facial (MOCK exitoso - 95% similitud)");
    return 95;
  }

  try {
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceBuffer },
      TargetImage: { Bytes: targetBuffer },
      SimilarityThreshold: 80,
    });

    const response = await rekognitionClient.send(command);
    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const match = response.FaceMatches[0];
      return match.Similarity || 0;
    }
    return 0;
  } catch (error) {
    console.error("❌ [Rekognition] Error al comparar rostros con AWS:", error);
    throw error;
  }
}

/**
 * Escanea una imagen en busca de palabras clave para validar si es un documento oficial (OCR)
 * @param documentBuffer Imagen del documento en formato Buffer
 * @returns true si parece un documento válido, false en caso contrario
 */
export async function detectDocumentText(documentBuffer: Buffer): Promise<boolean> {
  if (!rekognitionClient) {
    console.log("ℹ️ [Rekognition] Simulando OCR de documento (MOCK exitoso - documento válido)");
    return true;
  }

  try {
    const command = new DetectTextCommand({
      Image: { Bytes: documentBuffer }
    });

    const response = await rekognitionClient.send(command);
    if (response.TextDetections && response.TextDetections.length > 0) {
      const detectedText = response.TextDetections.map(t => t.DetectedText?.toUpperCase() || "").join(" ");
      
      // Palabras clave que indican que es una Cédula o Licencia de Chile
      const validKeywords = ["CEDULA", "IDENTIDAD", "LICENCIA", "CONDUCTOR", "REPUBLICA", "CHILE", "RUT"];
      
      const isValid = validKeywords.some(keyword => detectedText.includes(keyword));
      console.log(`ℹ️ [Rekognition] OCR Documento válido: ${isValid}`);
      return isValid;
    }
    return false;
  } catch (error) {
    console.error("❌ [Rekognition] Error al detectar texto en documento con AWS:", error);
    throw error;
  }
}
