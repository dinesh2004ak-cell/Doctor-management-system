const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/avatars',
  'uploads/certificates',
  'uploads/logos',
  'uploads/prescriptions'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let folder = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      folder = 'uploads/avatars/';
    } else if (file.fieldname === 'certificate' || file.fieldname === 'certificates' || file.fieldname === 'certificates[]') {
      folder = 'uploads/certificates/';
    } else if (file.fieldname === 'logo') {
      folder = 'uploads/logos/';
    } else if (file.fieldname === 'attachments') {
      folder = 'uploads/prescriptions/';
    }
    
    cb(null, folder);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter - allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP and PDF files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Max 5 files at once
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// Single file upload helper
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple files upload helper
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Upload avatar
const uploadAvatar = upload.single('avatar');

// Upload certificate
const uploadCertificate = upload.single('certificate');

// Upload multiple certificates
const uploadCertificates = upload.array('certificates', 5);

// Upload doctor registration (primary certificate and additional certificates)
const uploadDoctorRegistration = upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
  { name: 'certificates[]', maxCount: 10 }
]);

// Upload logo
const uploadLogo = upload.single('logo');

// Upload prescription attachments
const uploadPrescriptionFiles = upload.array('attachments', 5);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  handleMulterError,
  uploadAvatar,
  uploadCertificate,
  uploadCertificates,
  uploadDoctorRegistration,
  uploadLogo,
  uploadPrescriptionFiles
};
