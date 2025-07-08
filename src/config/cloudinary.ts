import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { cloudinary_config } from "../secrets";

// cloudinary.config({
//   cloud_name: "cloudni3",
//   api_key: "774899149288684",
//   api_secret: "Sxvlkwt9WHjK4Tm4rCUkGbgqLxs",
// });
cloudinary.config({
  cloud_name: String(cloudinary_config.cloud_name),
  api_key: String(cloudinary_config.api_key),
  api_secret: String(cloudinary_config.api_secret),
});

export const uploadToCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      // upload_preset: "online_shop",
      folder: "new_chapter",
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
