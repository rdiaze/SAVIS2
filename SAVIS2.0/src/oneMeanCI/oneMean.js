---
---
import {
  dropTextFileOnTextArea,
  parseCSVtoSingleArray,
  readLocalFile,
  enableUploadDataFile
} from "{{base}}../util/csv.js";
import {getSampleDataDirectory, getDefaultValues, extractDataByColumn, computeFrequencies, computeDataSimilarity} from "{{base}}../util/utilities.js"
import StackedDotChart from "{{base}}../util/stackeddotchart.js";
import { randomSubset, splitByPredicate, splitUsing } from "{{base}}../util/sampling.js";
import * as MathUtil from "{{base}}../util/math.js";
import translation from "{{base}}../util/translate.js";

export class OneMean {
  constructor(OneMeanDiv) {
    this.oneMeanDiv = OneMeanDiv
    this.translationData = translation.oneMean
    this.shiftMean = 0
    this.multiplyFactor = 0
    this.originalDataFreqs = {}
    this.originalData = []
    this.populationData = []
    this.sampleSize = 10
    this.numOfSamples = 1
    this.latestSampleDraw = []
    this.sampleMeans = []
    this.confidenceLevel = 95
    this.elements = {
      sampleDataSelectionDropdown: this.oneMeanDiv.querySelector("#sample-data"),
      csvDataTextArea: this.oneMeanDiv.querySelector("#csv-input"),
      loadDataButton: this.oneMeanDiv.querySelector('#load-data-btn'),
      originalDataTextArea: this.oneMeanDiv.querySelector("#original-data-display"),
      originalDataMeanDisplay: this.oneMeanDiv.querySelector("#original-mean"),
      originalDataStandardDeviationDisplay: this.oneMeanDiv.querySelector("#original-std"),
      resetDataButton: OneMeanDiv.querySelector("#reset-btn"),
      toggleCheckBoxes: this.oneMeanDiv.querySelectorAll("input[type='checkbox']"),
      dataSections: this.oneMeanDiv.querySelectorAll(".chart-input-form"),
      originialDataChart: this.oneMeanDiv.querySelector("#original-data-chart"),
      shiftMeanInput: this.oneMeanDiv.querySelector("#shiftMeanInput"),
      populationDataTextArea:this.oneMeanDiv.querySelector("#population-data-display"),
      populationDataMean: this.oneMeanDiv.querySelector("#population-mean"),
      populationDataSTD: this.oneMeanDiv.querySelector("#population-std"),
      multiplyPopulationDataSlider: this.oneMeanDiv.querySelector("#mul-factor"),
      multiplyPopulationDataDisplay: this.oneMeanDiv.querySelector("#mul-factor-display"),
      populationDataChart: this.oneMeanDiv.querySelector("#population-data-chart"),
      sampleSizeInput: this.oneMeanDiv.querySelector("#sample-size"),
      numberOfSamplesInput: this.oneMeanDiv.querySelector("#no-of-sample"),
      runSimBtn: this.oneMeanDiv.querySelector("#run-sim-btn"),
      sampleDrawTextArea: this.oneMeanDiv.querySelector("#most-recent-sample-display"),
      sampleDrawMean: this.oneMeanDiv.querySelector("#sample-mean"),
      sampleDrawSTD: this.oneMeanDiv.querySelector("#sample-sd"),
      sampleDrawSimError: this.oneMeanDiv.querySelector("#run-sim-error-msg"),
      sampleDrawChart: this.oneMeanDiv.querySelector("#sample-data-chart"),
      samplesMeanTextArea: this.oneMeanDiv.querySelector("#samples-mean-display"),
      sampleMeansMean: this.oneMeanDiv.querySelector("#samples-mean"),
      sampleMeansSTD: this.oneMeanDiv.querySelector("#samplemeans-std"),
      confidenceLevelSlider: this.oneMeanDiv.querySelector("#confidence-level"),
      confidenceLevelDisplay: this.oneMeanDiv.querySelector("#confidence-level-display"),
      confidenceIntervalTotalSamples: this.oneMeanDiv.querySelector("#total-samples"),
      confidenceIntervalChart: this.oneMeanDiv.querySelector("#statistic-data-chart"),
      lower: this.oneMeanDiv.querySelector("#lower"),
      upper: this.oneMeanDiv.querySelector("#upper"),
      buildCI: this.oneMeanDiv.querySelector("#buildci"),
      uploadbtn: this.oneMeanDiv.querySelector("#upload-btn"),
      fileInput: this.oneMeanDiv.querySelector("#fileInput"),
      size: this.oneMeanDiv.querySelector("#originalsize")
      
    }
    this.dataSections = {
      originalData: 'originalData',
      hypotheticalPopulationData: 'hypotheticalPopulationData',
      sampleDrawSection: 'sampleDrawSection',
      confidenceIntervalSection: 'confidenceIntervalSection',
    }
  
    this.sampleDataOptions = {
      
      "Select Sample Data": null,
      Sample1: `${getSampleDataDirectory()}/sample1.csv`,
      Sample2: `${getSampleDataDirectory()}/sample2.csv`
    }

    this.datasets = [{
      label: this.translationData.original,
      backgroundColor: 'orange',
      data: []
    }, {
      label: this.translationData.hypotheticalPopulation,
      backgroundColor: 'orange',
      data: []
    },{
      label: this.translationData.mostRecentDraw,
      backgroundColor: 'purple',
      data: []
    }, [
      {
        label: this.translationData.InInterval,
        backgroundColor: 'green',
        data: []
      },
      {
        label: this.translationData.NotInInterval,
        backgroundColor: 'red',
        data: []
      }
    ]]
    this.charts = {
      originalDataChart: new StackedDotChart(
        this.elements.originialDataChart,
        [this.datasets[0]]
      ),
      hypotheticalPopulationChart: new StackedDotChart(
        this.elements.populationDataChart,
        [this.datasets[1]]
      ),
      sampleDrawChart: new StackedDotChart(
        this.elements.sampleDrawChart,
        [this.datasets[2]]

      ),
      confidenceIntervalChart: new StackedDotChart(
        this.elements.confidenceIntervalChart,
        this.datasets[3]
      )
    }
    this.charts.hypotheticalPopulationChart.setAnimationDuration(0)
    this.charts.sampleDrawChart.setAnimationDuration(0)
    this.charts.confidenceIntervalChart.setAnimationDuration(0)
    this.intialize()
    

  }
  
  intialize(){
    this.loadSampleDataOptions()
    this.addSelectDataDropDownListener()
    this.addLoadButtonListener()
    this.addToggleCheckBoxesListerners()
    this.addShiftMeanInputListener()
    this.addMultiplyFactorSliderListener()
    this.addResetButtonListener()
    this.addRunSimulationClickListener()
    this.addConfidenceLevelSliderListener()
    this.addBuildCIListener()
    enableUploadDataFile(this.elements.uploadbtn, this.elements.fileInput, this.elements.csvDataTextArea)
    dropTextFileOnTextArea(this.elements.csvDataTextArea)

  }
  /* Start of  Add Event Listeners*/
  addSelectDataDropDownListener(){
    this.elements.sampleDataSelectionDropdown.addEventListener(
      'change',
      this.renderSampleDataSelectionCallBackFunc()
    )
  }
  addLoadButtonListener(){
    this.elements.loadDataButton.addEventListener('click', this.loadDataButtonCallBackFunc())
  }

  addResetButtonListener(){
    this.elements.resetDataButton.addEventListener('click', this.resetButtonCallBackFunc())
  }
  addToggleCheckBoxesListerners(){
    this.elements.toggleCheckBoxes.forEach((checkbox, index) => {
      checkbox.addEventListener('change', (event) => {
        if(!checkbox.checked){
          this.elements.dataSections[index].classList.add('hideDataSection')

        }else{
          this.elements.dataSections[index].classList.remove('hideDataSection')
        }
        event.preventDefault()
      })

    })
  }
  addShiftMeanInputListener(){
    this.elements.shiftMeanInput.addEventListener('input', (event) => {
      this.shiftMean = Number(this.elements.shiftMeanInput.value) || 0
      this.updatePopulationData()
      this.clearResult()
      event.preventDefault()
      
    })
  }
  addMultiplyFactorSliderListener(){
    this.elements.multiplyPopulationDataSlider.addEventListener('input', (event) => {
      this.multiplyFactor = Number(this.elements.multiplyPopulationDataSlider.value) || 0
      this.elements.multiplyPopulationDataDisplay.innerText = this.multiplyFactor
      this.updatePopulationData()
      this.clearResult()
      event.preventDefault()
    })
  }
  addConfidenceLevelSliderListener(){
    this.elements.confidenceLevelSlider.addEventListener('input', (event) => {
      this.confidenceLevel = Number(this.elements.confidenceLevelSlider.value) || 95
      this.elements.confidenceLevelDisplay.innerText = this.confidenceLevel
      

      event.preventDefault()
    })
  }
  addBuildCIListener(){
    this.elements.buildCI.addEventListener('click', (event) => {
      this.updateData(this.dataSections.confidenceIntervalSection)

      event.preventDefault()
    })
  }
  
  addRunSimulationClickListener(){
    this.elements.runSimBtn.addEventListener('click', this.runSimulationCallBackFunc())
  }
  /* End of Add Event Listeners */
  
  loadSampleDataOptions(){
    Object.keys(this.sampleDataOptions).forEach(sampleDataOption => {
        const option = document.createElement("option")
        option.value = sampleDataOption
        option.innerText = sampleDataOption
        this.elements.sampleDataSelectionDropdown.appendChild(option)
    });
  }

  renderSampleDataSelectionCallBackFunc(){
    let render = (event) =>  {
      //get the selected sample data option
      const selectedSampleDataOption = this.elements.sampleDataSelectionDropdown.value
      if(selectedSampleDataOption !== "Select Sample Data"){
        readLocalFile(this.sampleDataOptions[selectedSampleDataOption]).then(
          data => this.elements.csvDataTextArea.value = data
        )
      }else{
        this.elements.csvDataTextArea.value = ""
      }
      event.preventDefault()
    }
    return render
  }
  loadDataButtonCallBackFunc(){
    let loadDataBtn = (event) => {
      // get the data
        const rawData = this.elements.csvDataTextArea.value
        const cleanedData = parseCSVtoSingleArray(rawData)
        const freqs = computeFrequencies(extractDataByColumn(cleanedData, "value"))
        if(!this.originalData || !computeDataSimilarity(this.originalDataFreqs,freqs)){
          this.originalData = cleanedData
          this.originalDataFreqs = freqs
          this.shiftMean  = 0
          this.multiplyFactor = 0
          this.sampleSize = 10 
          this.numOfSamples = 1
          this.confidenceLevel = 95
          this.updateData(this.dataSections.originalData)
          this.clearResult()
          this.updatePopulationData()
        }
        this.clearResult()
       
      event.preventDefault()
    }
    return loadDataBtn
  }
  runSimulationCallBackFunc(){
    let runSimulationBtn = (event) => {
      const sampleSize = Number(this.elements.sampleSizeInput.value) || 10
      const numberOfSamples = Number(this.elements.numberOfSamplesInput.value) || 1
      this.runSimulation(sampleSize, numberOfSamples)
      event.preventDefault()
    }
    return runSimulationBtn
  }
  resetButtonCallBackFunc(){
    let resetDataBtn = (event) => {
        this.elements.csvDataTextArea.value = ""
          this.originalData = []
          this.originalDataFreqs = []
          this.shiftMean  = 0
          this.multiplyFactor = 0
          this.sampleSize = 10 
          this.numOfSamples = 1
          this.confidenceLevel = 95
          this.elements.size.innerText = 0
          this.elements.sampleDataSelectionDropdown.selectedIndex = 0
          this.updateData(this.dataSections.originalData)
          this.clearResult()
          this.updatePopulationData()
        
        this.clearResult()
       
      event.preventDefault()
    }
    return resetDataBtn
  }
  runSimulation(sampleSize, numberOfSamples){
    let newSamples = []
    try{
          if(this.populationData.length < sampleSize) throw this.translationData.errorNoPopulation;
          for (let i = 0; i < numberOfSamples; i++){
            let newSample = randomSubset(this.populationData, sampleSize)
            newSample = newSample.chosen
            
            const chosenMean = MathUtil.roundToPlaces(MathUtil.mean(extractDataByColumn(newSample, "value")), 3)
            newSamples.push(chosenMean)
            if (i === numberOfSamples - 1){
              this.latestSampleDraw = newSample
            }
         }
         if(this.sampleSize !== sampleSize){
           this.sampleSize = sampleSize
           this.sampleMeans = newSamples
         }else{
           this.sampleMeans = this.sampleMeans.concat(newSamples)
         }
         this.updateData(this.dataSections.sampleDrawSection)
         this.updateData(this.dataSections.confidenceIntervalSection)

    }catch (err)
    {
      let errMsg ="ERROR\n"
      if (this.populationData.length)
        errMsg += this.translationData.errorNotEnoughElements;
      else
        errMsg += this.translationData.errorNoPopulation;
      this.elements.sampleDrawSimError.innerText= errMsg;
      setTimeout(() => {
        this.elements.sampleDrawSimError.innerText = "";
      }, 2000);

    }
  }
  clearResult(){
    this.elements.shiftMeanInput.value = this.shiftMean
    this.elements.multiplyPopulationDataSlider.value = this.multiplyFactor
    this.elements.multiplyPopulationDataDisplay.innerText = this.multiplyFactor
    this.elements.sampleSizeInput.value = this.sampleSize
    this.elements.numberOfSamplesInput.value = this.numOfSamples
    this.elements.confidenceLevelDisplay.innerText = this.confidenceLevel
    this.elements.confidenceLevelSlider.value = this.confidenceLevel
    this.latestSampleDraw = []
    this.sampleMeans = []
    this.updateData(this.dataSections.sampleDrawSection)
    this.updateData(this.dataSections.confidenceIntervalSection)
    this.updateConfidenceIntervalChartLabel("null", "null")
    this.elements.lower.innerText = ""
    this.elements.upper.innerText = ""

  }
  
  updatePopulationData(){
    this.populationData = []
    
     this.originalData.forEach(row => {
      let startID = this.multiplyFactor === 0? row.id: (row.id * this.multiplyFactor) - (this.multiplyFactor -1) + (row.id - 1)
      for(let i = 0; i <= this.multiplyFactor; i++){
        this.populationData.push({id: startID  + i, value: MathUtil.roundToPlaces(row.value + this.shiftMean, 4)})
      }
    })
    this.updateData(this.dataSections.hypotheticalPopulationData)
  }
    updateData(dataSectioName){
      let [data, meanElement, dataStringTextAreaElement, chart] = [undefined, undefined, undefined, undefined]
      if(dataSectioName === this.dataSections.originalData){
          chart =  this.charts.originalDataChart
          data = this.originalData
          meanElement = this.elements.originalDataMeanDisplay
          dataStringTextAreaElement = this.elements.originalDataTextArea
          this.elements.size.innerText = data.length
          this.updateStandardDeviation(this.elements.originalDataStandardDeviationDisplay, extractDataByColumn(data,"value"))
      }else if(dataSectioName === this.dataSections.hypotheticalPopulationData){
          chart = this.charts.hypotheticalPopulationChart
          data = this.populationData
          meanElement = this.elements.populationDataMean
          dataStringTextAreaElement = this.elements.populationDataTextArea
          this.updateStandardDeviation(this.elements.populationDataSTD, extractDataByColumn(data, "value"))
      }else if (dataSectioName === this.dataSections.sampleDrawSection){
          chart = this.charts.sampleDrawChart
          data = this.latestSampleDraw
          meanElement = this.elements.sampleDrawMean
          dataStringTextAreaElement = this.elements.sampleDrawTextArea
          this.updateStandardDeviation(this.elements.sampleDrawSTD, extractDataByColumn(data, 'value'))


          
      }else{ 
        chart = this.charts.confidenceIntervalChart
        data = this.sampleMeans
        meanElement = this.elements.sampleMeansMean
        dataStringTextAreaElement = this.elements.samplesMeanTextArea
        this.elements.confidenceIntervalTotalSamples.innerText = this.sampleMeans.length
        this.updateStandardDeviation(this.elements.sampleMeansSTD, data)

      }
      let pointRadius = 6;
      let values = undefined;
      if(chart){
          if(data.length > 0){
            if(dataSectioName !== this.dataSections.confidenceIntervalSection){
              values = extractDataByColumn(data, "value")
              chart.setDataFromRaw([values])
            }else{
              const confidenceInterval = MathUtil.getCutOffInterval(this.confidenceLevel, this.sampleMeans.length)
              let [leftBound, rightBound] = confidenceInterval
              const temp = this.sampleMeans.map(val => val)
              temp.sort((a, b) => a - b)
           
              let [chosen, unchosen] = splitUsing(temp, this.getPredicateFunction(leftBound, rightBound, temp))
              this.elements.lower.innerText = temp[leftBound] 
              this.elements.upper.innerText = temp[rightBound >= temp.length ? rightBound - 1: rightBound]
              chart.setDataFromRaw([chosen, unchosen])
              this.updateConfidenceIntervalChartLabel(temp[leftBound], temp[rightBound >= temp.length ? rightBound - 1: rightBound])
              
              pointRadius = 4

            }

    

             

            chart.changeDotAppearance(pointRadius, undefined)
            let [min, max] = [MathUtil.minInArray(values) , MathUtil.maxInArray(values)]
            chart.setScale(min, max)
          }else{
            chart.clear()
          }
          chart.scaleToStackDots()
          chart.chart.update()

      }
      
      this.updateMean(meanElement, dataSectioName !== this.dataSections.confidenceIntervalSection ?  extractDataByColumn(data, "value"): data)
      let dataTransformationFunc = null
      if(dataSectioName !== this.dataSections.confidenceIntervalSection){
        dataTransformationFunc = () => {
          return data.reduce(
            (currString, currentRow) => currString + `${currentRow.id}`.padEnd(8, ' ')  + `${currentRow.value}\n`,
            `${this.translationData.id}`.padEnd(8, ' ') + `${this.translationData.value}\n`

          )
        }
      }else{
        dataTransformationFunc = () => {
          return data.reduce(
            (currString, currentRow, index) => currString + `${index + 1}`.padEnd(8, ' ') + `${currentRow}\n`,
            `${this.translationData.sampleNo}`.padEnd(8, ' ') + `${this.translationData.mean2}\n`
          )
        }
      }
      this.updateDataTextArea(dataTransformationFunc, dataStringTextAreaElement)
  }
  updateStandardDeviation(standardDeviationDisplay, data){
    const stddev = data.length >0 ? MathUtil.stddev(data): getDefaultValues().standardDeviation
    standardDeviationDisplay.innerText = MathUtil.roundToPlaces(stddev, 2)
  }
  updateMean(meanDisplayElement, data) {
       const mean = data.length > 0 ? MathUtil.mean(data): getDefaultValues().mean
       meanDisplayElement.innerText = MathUtil.roundToPlaces(mean, 2)
    
  }
  updateDataTextArea(transform, dataTextAreaElement){
      const dataString = transform()
      dataTextAreaElement.value = dataString
  }
  getPredicateFunction(leftBound, rightBound, temp) {
    let predictateFunction = (value, index) => {
        return value >= temp[leftBound] && value <= temp[rightBound >= temp.length ? rightBound - 1: rightBound]
    }
    return predictateFunction
  }
  updateConfidenceIntervalChartLabel(leftBound, rightBound){
      if(leftBound === "null" || rightBound === "null"){
        this.charts.confidenceIntervalChart.updateLabelName(0, this.translationData.InInterval)
        this.charts.confidenceIntervalChart.updateLabelName(1, this.translationData.NotInInterval)
        return 
      }
      this.charts.confidenceIntervalChart.updateLabelName(0, `${this.translationData.InInterval} [${leftBound}, ${rightBound}]`)
      this.charts.confidenceIntervalChart.updateLabelName(1, `${this.translationData.NotInInterval} [${leftBound}, ${rightBound}]`)
      
  }
  
  
}
