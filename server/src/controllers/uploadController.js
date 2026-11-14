import { createUploadUrl } from "../utils/s3.js";

const presignUploads = async (req, res, next) => {
  try {
    const { files } = req.validated.body;

    const userId = String(req.user._id);

    const uploads = await Promise.all(
      files.map((file) =>
        createUploadUrl({
          userId,
          contentType: file.contentType,
          size: file.size,
        }),
      ),
    );

    res.json({ success: true, data: uploads });
  } catch (err) {
    next(err);
  }
};

export default presignUploads;
