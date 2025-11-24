import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION,
});

async function createCollection() {
  try {
    const result = await rekognition
      .createCollection({
        CollectionId: process.env.AWS_COLLECTION_ID!,
      })
      .promise();

    console.log("Collection created:", result);
  } catch (err: any) {
    if (err.code === "ResourceAlreadyExistsException") {
      console.log("Collection already exists");
    } else {
      console.error("Error creating collection:", err);
    }
  }
}

createCollection();
