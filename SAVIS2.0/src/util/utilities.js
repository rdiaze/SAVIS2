export function getSampleDataDirectory(){
  return  "../sampleData";
}


export function getDefaultValues(){
  return {
    mean: 'NaN',
    standardDeviation: 'NaN'
  }
}
export function extractDataByColumn(data, columnName){
    return data.map(row =>  row[columnName])
}
export function computeDataSimilarity(data1Frequencies, data2Frequencies){
    let data1Keys = Object.keys(data1Frequencies)
    let data2Keys = Object.keys(data2Frequencies)
    if (data1Keys.length !== data2Keys.length){
      return false;
    }
    for (let key of data2Keys){
      if (data1Frequencies[key] !==  data2Frequencies[key]){
        return false;
      }
    }
    return true;

}
export function computeFrequencies(data){
  let freqs = {}
  data.forEach((object) => {
    if (freqs.hasOwnProperty(object)){
      freqs[object] += 1
    }else{
      freqs[object] = 1
    }
  })
  return freqs
}