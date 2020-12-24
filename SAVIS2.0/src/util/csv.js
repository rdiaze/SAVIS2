export function dropTextFileOnTextArea(textAreaElement) {
  textAreaElement.addEventListener("dragover", () => {
    textAreaElement.classList.add("dragover");
  });

  textAreaElement.addEventListener("dragleave", () => {
    textAreaElement.classList.remove("dragover");
  });

  textAreaElement.addEventListener("drop", e => {
    textAreaElement.classList.remove("dragover");
    let file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = event => {
      textAreaElement.value = event.target.result;
    };
    reader.readAsText(file);
    e.preventDefault();
  });
}
export function enableUploadDataFile(uploadButton, fileInput, textAreaElement){
  uploadButton.addEventListener('click', event => {
    fileInput.click()
    event.preventDefault()
  })
  fileInput.addEventListener('change', event => {
    const file = fileInput.files[0]
    const reader = new FileReader();
    reader.onload = event => {
      textAreaElement.value = event.target.result;
    };
    reader.readAsText(file);

    event.preventDefault()
  })

}
/**
 * rawData format:
 * a,b,c
 * 1,2,3
 * 15.2,54.3,55.3
 *
 * return {
 * a: [1, 15.2]
 * b: [2, 54.3]
 * c: [3, 55.3]
 * }
 *
 * throw error if data not match
 */
export function parseCsvVariableByCol(rawData, columns = null) {
  const [Header, ...data] = rawData.split(/[\r\n]+/);
  
  let varNames = !columns ? Header.split(/[\t,]/).map(x => x.trim()): columns;
  const res = varNames.reduce((acc, x) => {
    return { ...acc, [x]: [] };
  }, {});
  if(columns){
    data.unshift(Header)
  }

  data.forEach(row => {
    const nums = row.match(/(\d+(\.\d+)?)|-(\d+(\.\d+)?)/g);
    varNames.forEach((x, index) => {
      if (nums && nums.length === varNames.length)
        res[x].push(Number(nums[index]));
    });
  });
  return res;
}

export function parseCSVtoSingleArray(rawData) {
  const numRegex = /(\d+(\.\d+)?)/;
  return rawData
    .split(/[\r\n]+/)
    .filter(x => numRegex.test(x))
    .map((x, index) => ({
      id: index + 1,
      value: Number(x.match(numRegex)[0])
    }));
}

//return promise
export function readLocalFile(filePath) {
  return fetch(filePath).then(r => r.text());
}
