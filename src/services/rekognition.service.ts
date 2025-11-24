import AWS from "aws-sdk";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

/**
 * 🚀 FORCE AWS CONFIG (highest precedence)
 */
AWS.config.update({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

// create client AFTER config
const rekognition = new AWS.Rekognition();

/**
 * Convert base64 (JPEG) → raw image buffer
 */
function convertBase64(base64: string): Buffer {
  // remove prefix
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");

  // AWS is sensitive to whitespace/newlines → trim
  return Buffer.from(cleaned.trim(), "base64");
}

/**
 * REGISTER FACE
 */
export async function registerFace(imageBase64: string): Promise<string> {
  const bytes = convertBase64(imageBase64);
  const faceId = uuidv4();

  const params: AWS.Rekognition.IndexFacesRequest = {
    CollectionId: process.env.AWS_COLLECTION_ID!,
    ExternalImageId: faceId,
    Image: { Bytes: bytes },
    MaxFaces: 1,
    QualityFilter: "AUTO",
    DetectionAttributes: [],
  };

  console.log("📌 REGISTER → Collection:", params.CollectionId);

  try {
    const response = await rekognition.indexFaces(params).promise();

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      throw new Error("No face detected. Please retake the photo.");
    }

    return faceId;
  } catch (err: any) {
    console.error("❌ REGISTER ERROR:", err);
    throw new Error(
      err?.message ||
        "Failed to index face. Ensure good lighting and clear face in frame."
    );
  }
}

/**
 * SEARCH FACE
 */
export async function searchFace(imageBase64: string): Promise<string | null> {
  const bytes = convertBase64(imageBase64);

  const params: AWS.Rekognition.SearchFacesByImageRequest = {
    CollectionId: process.env.AWS_COLLECTION_ID!,
    Image: { Bytes: bytes },
    MaxFaces: 1,
    FaceMatchThreshold: 90,
    QualityFilter: "AUTO",
  };

  console.log("📌 SEARCH → Collection:", params.CollectionId);

  try {
    const result = await rekognition.searchFacesByImage(params).promise();

    if (!result.FaceMatches || result.FaceMatches.length === 0) {
      return null;
    }

    const match = result.FaceMatches[0];

    if (!match.Face?.ExternalImageId || match.Similarity! < 90) {
      return null;
    }

    return match.Face.ExternalImageId;
  } catch (err: any) {
    console.error("❌ SEARCH ERROR:", err);
    throw new Error("Failed to search face: " + err.message);
  }
}
