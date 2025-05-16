import path from "path";

export default (uploadDirectoryPath: string): { base: string, ext: string } => {
  const filename = String(uploadDirectoryPath.split("/").pop());
  return {
    base: path.basename(filename, path.extname(filename)),
    ext: path.extname(filename),
  };
};