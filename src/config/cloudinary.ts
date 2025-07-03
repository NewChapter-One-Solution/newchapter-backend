import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "cloudni3",
  api_key: "774899149288684",
  api_secret: "Sxvlkwt9WHjK4Tm4rCUkGbgqLxs",
});

export const uploadToCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    
    const result = await cloudinary.uploader.upload(localFilePath, {
      upload_preset: "online_shop",
      resource_type: "auto",
    });

    fs.unlink(localFilePath, () => {
      console.log("Img removed");
    });

    return result;
  } catch (error) {
    fs.unlink(localFilePath, () => {
      console.log("err Img removed");
    });
    console.log(error);
  }
};

export const deleteImageFromCloudnary = async (publicKey: string) => {
  const res = await cloudinary.uploader.destroy(publicKey);
  return res;
};
