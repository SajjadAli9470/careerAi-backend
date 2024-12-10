import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname + '-' + uniqueSuffix)
  }
});


// Set up file filter to only accept PDFs
const fileFilter = (req, file, cb) => {
      cb(null, true); // Reject the file
  
};

// Initialize multer with storage and file filter configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Optional: limit the file size to 10 MB
});

export { upload };
