// Parse the arguments in format like --name "test" or -n "test"
export const parseArgs = () => {
  // Get the command-line arguments
  const args = process.argv.slice(2);
  // Display the arguments
  // console.log("Command-line arguments:", args);

  const result = {};
  let currentKey = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      // This is a long argument
      currentKey = arg.substring(2);
      result[currentKey] = true;
    } else if (arg.startsWith("-")) {
      // This is a short argument
      currentKey = arg.substring(1);
      result[currentKey] = true;
    } else {
      // This is a value
      if (currentKey) {
        result[currentKey] = arg;
      }
      currentKey = null;
    }
  }
  return result;
};

export default parseArgs;
