const multer = require("multer");
const fs = require("fs");

module.exports = {
  uploader(destination, prefix) {
    let Path = "./public";

    const storage = multer.diskStorage({
      destination: (req, file, callback) => {
        const dir = Path + destination;
        /**
         * bila dir/direktori sudah ada, maka log "dir already exist"
         * kemudian callback null alias tidak jadi bikin dir
         */
        if (fs.existsSync(dir)) {
          // console.log(dir, " already exist");
          callback(null, dir);
        } else {
          /**
           * bila dir belum ada, buat baru, lalu log "dir was made"
           * bila error dalam proses buat dir, maka callback errornya
           */
          fs.mkdir(dir, { recursive: true }, err => callback(err, dir));
          console.log(dir, " was made");
        }
      },

      filename: (req, file, callback) => {
        let originalname = file.originalname;
        let ext = originalname.split(".");
        let filename = `${prefix}-${Date.now()}.${ext[ext.length - 1]}`;
        console.log(ext[0], "uploaded as ", filename);
        callback(null, filename);
      }
    });

    const imageFilter = (req, file, callback) => {
      const ext = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx)$/;
      if (!file.originalname.match(ext)) {
        return callback(new Error("Only selected file types are allowed!"), false);
      }
      callback(null, true);
    };

    return multer({ storage, fileFilter: imageFilter });
  }
};
