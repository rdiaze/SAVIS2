---
---
import {
  dropTextFileOnTextArea,
  // TODO(matthewmerrill): use these library functions
  parseCSVtoSingleArray,
  parseCsvVariableByCol,
  readLocalFile,
  enableUploadDataFile
} from "{{base}}../util/csv.js";
import StackedDotChart from '{{base}}../util/stackeddotchart.js';
import TailChart from "{{base}}../util/tailchart.js";
import * as MathUtil from '{{base}}../util/math.js';
import * as Summaries from "{{base}}../util/summaries.js";
import { randomSubset, splitUsing } from '{{base}}../util/sampling.js';
import DataManipulationEngine from "{{base}}../util/DataManipulationEngine.js"
import translation from "{{base}}../util/translate.js";
import {getSampleDataDirectory }from "{{base}}../util/utilities.js";

export class TwoMean {
  constructor(twoMeanDiv) {
    this.twoMeanDiv = twoMeanDiv
    this.translation = translation.twoMean
    this.defaultIncrement = 10
    this.sampleDataOptions = null
    this.parsedData = null
    this.originalDataCols = ["Group", "Value"]
    this.dataManipulationEngine = new DataManipulationEngine()
    this.sampleDifferences = []
    this.originalDiff = 0
    this.group1Size = 0
    this.group2Size = 0

    this.elements =  {
        sampleSelect: this.twoMeanDiv.querySelector("#sample-select"),
        originalData: this.twoMeanDiv.querySelector('#csv-input'),
        loadButton: this.twoMeanDiv.querySelector("#load-btn"),
        originalDataGroup1: this.twoMeanDiv.querySelector("#data-chart-1"),
        originalDataGroup2: this.twoMeanDiv.querySelector("#data-chart-2"),
        group1Mean: this.twoMeanDiv.querySelector('#dataMean1'),
        group2Mean: this.twoMeanDiv.querySelector("#dataMean2"),
        group1SD: this.twoMeanDiv.querySelector("#dataSD1"),
        group2SD: this.twoMeanDiv.querySelector("#dataSD2"),
        originalMeanDiff: this.twoMeanDiv.querySelector("#dataMeanDiff"),
        increaseGroup1: this.twoMeanDiv.querySelector("#multiply-group1"),
        increaseGroup2: this.twoMeanDiv.querySelector("#multiply-group2"),
        runSimButton: this.twoMeanDiv.querySelector("#runSimButton"),
        numSimulations: this.twoMeanDiv.querySelector("#num-simulations"),
        sampleChart1: this.twoMeanDiv.querySelector("#sample-chart-1"),
        sampleChart2: this.twoMeanDiv.querySelector("#sample-chart-2"),
        sampleMean1: this.twoMeanDiv.querySelector("#sampleMean1"),
        sampleMean2: this.twoMeanDiv.querySelector("#sampleMean2"),
        sampleSD1: this.twoMeanDiv.querySelector("#sampleSD1"),
        sampleSD2: this.twoMeanDiv.querySelector("#sampleSD2"),
        sampleMeanDiff: this.twoMeanDiv.querySelector("#sampleMeanDiff"),
        lastDiff: this.twoMeanDiv.querySelector('#originalDiff'),
        lastMean: this.twoMeanDiv.querySelector("#mean"),
        lastSD: this.twoMeanDiv.querySelector("#stddev"),
        totalSamples: this.twoMeanDiv.querySelector("#total"),
        diffChart: this.twoMeanDiv.querySelector("#diff-chart"),
        ciDisplay: this.twoMeanDiv.querySelector("#confidence-level-display"),
        ci: this.twoMeanDiv.querySelector("#confidence-level"),
        lower: this.twoMeanDiv.querySelector("#lower"),
        upper: this.twoMeanDiv.querySelector("#upper"),
        size1: this.twoMeanDiv.querySelector("#size1"),
        size2: this.twoMeanDiv.querySelector("#size2"),
        buildCi: this.twoMeanDiv.querySelector("#buildci"),
        uploadbtn: this.twoMeanDiv.querySelector("#upload-btn"),
        fileInput: this.twoMeanDiv.querySelector("#fileInput"),
        incrementButtons: this.twoMeanDiv.querySelectorAll(".incrementButton")
    }
    this.datasets = [
      { label: this.translation.group1, backgroundColor: 'orange', data: [] },
      { label: this.translation.group2, backgroundColor: 'rebeccapurple', data: [] },
      [
        {label: this.translation.InInterval, backgroundColor: 'green', data: []},
        {label: this.translation.NotInInterval, backgroundColor: 'red', data: []}

      ]
    ];
    
    this.charts = {
      originalDataGroup1Chart: new StackedDotChart(this.elements.originalDataGroup1, [this.datasets[0]]),
      originalDataGroup2Chart: new StackedDotChart(this.elements.originalDataGroup2, [this.datasets[1]]),
      sampleChart1: new StackedDotChart(this.elements.sampleChart1, [this.datasets[0]]),
      sampleChart2: new StackedDotChart(this.elements.sampleChart2, [this.datasets[1]]),
      diffChart: new StackedDotChart(this.elements.diffChart, this.datasets[2])
    }
    this.charts.sampleChart2.setAnimationDuration(0)
    this.charts.sampleChart1.setAnimationDuration(0)
    this.charts.diffChart.setAnimationDuration(0)



    
    this.sampleDataOptions  = {
      [this.translation.selectData]: null,
      'Sample 1': `${getSampleDataDirectory()}/twomean_sample1.csv`,
      'Sample 2': `${getSampleDataDirectory()}/twomean_sample2.csv`,  
    }
    this.initalize()
  }
  initalize(){
    this.loadSampleDataSelections()
    this.addChangeListenerToSampleSelect()
    this.loadButtonClickListener()
    this.addIncreaseListeners()
    this.runSimButtonClickListener()
    this.addConfidenceLevelListener()
    this.addBuildCiListener()
    enableUploadDataFile(this.elements.uploadbtn, this.elements.fileInput, this.elements.originalData)
    dropTextFileOnTextArea(this.elements.originalData)


  }
  loadSampleDataSelections(){
    const keys = Object.keys(this.sampleDataOptions)
    keys.forEach((key) => {
       const option = document.createElement("option")
       option.value = key
       option.textContent = key
       this.elements.sampleSelect.appendChild(option)
    })
  }
  addChangeListenerToSampleSelect(){
    this.elements.sampleSelect.addEventListener('change', (event) => {
      const value = this.elements.sampleSelect.value;
      if (value !== this.translation.selectData){
        readLocalFile(this.sampleDataOptions[value]).then(data => {
          this.elements.originalData.value = data
        })
        
      }else{
        this.elements.originalData.value = ""
      }

      event.preventDefault()
    })
  }
  addConfidenceLevelListener(){
    this.elements.ci.addEventListener('input', (event) => {
      const level = Number(this.elements.ci.value) || 0
      this.elements.ciDisplay.innerText = level

      event.preventDefault()
    })
  }
  addBuildCiListener(){
    this.elements.buildCi.addEventListener('click', event => {
      if(this.dataManipulationEngine.isEmpty() || this.sampleDifferences.length === 0) return
      if (!this.validateIncrement(1) && !this.validateIncrement(2)) {
        alert(this.translation.incrementWarning)
        return 
      }
      const level = Number(this.elements.ci.value) || 0
      if(level > 0){
        this.updateLastSecCharts()
      }
       event.preventDefault()
    })
  }
  addIncreaseListeners(){
    this.elements.incrementButtons.forEach((button, index) => {
      const buttonNumber = index + 1
      const inputElement = this.elements[`increaseGroup${buttonNumber}`]
      button.addEventListener('click', this.getIncreaseDataCallBackFunc(buttonNumber, inputElement))

    })
  
  }
  validateIncrement(groupNumber){
    const groupID = `group${groupNumber}Data`
    const currLen = this.dataManipulationEngine.property('length', [groupID])[groupID]
    const originalLen = groupNumber === 1 ? this.group1Size: this.group2Size
    if (currLen <= originalLen){
      return false
    }else{
        return true
    }
    
    
  }
  getIncreaseDataCallBackFunc(group, element){
    const increase = (event) => {
      if(this.dataManipulationEngine.isEmpty(`group${group}Data`)){
        return 
      }
      this.increase(group, Number(element.value) || 0)
      this.clear('original')
      this.update('original')
      event.preventDefault()
    }
    return increase
  }
  loadButtonClickListener(){
    this.elements.loadButton.addEventListener('click', this.loadData())
  }
  runSimButtonClickListener(){
    this.elements.runSimButton.addEventListener('click', (event) => {
      if(this.dataManipulationEngine.isEmpty()) return 
      if(!this.validateIncrement(1) && !this.validateIncrement(2)) {
        alert(this.translation.incrementWarning)
        return 
      } 
      this.runSimulations()
      event.preventDefault()
    })
  }
  loadData(){
    const loadDataFunc = (event) => {
       
        if(!this.elements.originalData.value){
          this.clear()
          
          this.manipulateRunSims('disabled')
          return 
        }
        this.parsedData = parseCsvVariableByCol(this.elements.originalData.value.trim(), this.originalDataCols)
        if(this.parsedData.Group.length == 0){
          this.clear()
          
          this.manipulateRunSims('disabled')
          return 
        }
        
        const {1: group1, 2: group2} = this.seperateDataByColumn(this.parsedData, "Value", "Group")
        const {1: firstGroup, 2: secondGroup} = this.seperateDataByColumn(this.parsedData, "Group", "Group")
        this.dataManipulationEngine.register('group1', firstGroup)
        this.dataManipulationEngine.register('group2', secondGroup)
        this.dataManipulationEngine.register('group1Data', group1)
        this.dataManipulationEngine.register('originalData1', group1.map(val => val))
        this.dataManipulationEngine.register('originalData2', group2.map(val => val))
        this.dataManipulationEngine.register('group2Data', group2)
        this.group1Size = group1.length
        this.group2Size = group2.length
        this.resetIncreaseFilters()
        this.clear('all')
        this.update('all')
        this.manipulateRunSims('enabled')
        this.charts.sampleChart1.scaleToStackDots();
        this.charts.sampleChart2.scaleToStackDots();
        event.preventDefault()
    }
    return loadDataFunc
  }
  update(section = "all"){
    if (section === 'all' || section == 'original'){
      this.updateOriginalDataSection()
    }
  }
  manipulateRunSims(action){
    if(action == 'enabled'){
      this.elements.runSimButton.removeAttribute("disabled")
      this.elements.numSimulations.removeAttribute("disabled")
    }else{
      this.elements.runSimButton.setAttribute("disabled", true)
      this.elements.numSimulations.setAttribute("disabled", true);
    }
  }
  clear(section = 'all'){
    if(section == 'all' || section == 'original'){
      this.clearOriginalDataSection()
    }
    if(section == 'all' || section == 'simulation'){
      this.clearSimulationDataSection()
    }
    if(section == 'all' || section == 'last'){
      this.clearLastSection()
    }

  }
  resetIncreaseFilters(){
    this.elements.increaseGroup2.value = this.defaultIncrement
    this.elements.increaseGroup1.value = this.defaultIncrement
    
  }
  reset(){
    this.clear()
    this.resetIncreaseFilters()
    this.elements.originalData.value = ""
    this.dataManipulationEngine.thrash()
  }
  clearOriginalDataSection(){
    this.elements.group1Mean.innerText = this.translation.gp1Mean
    this.elements.group2Mean.innerText = this.translation.gp2Mean
    this.elements.group1SD.innerText = this.translation.gp1SD
    this.elements.group2SD.innerText = this.translation.gp2SD
    this.elements.size1.innerText = this.translation.size1
    this.elements.size2.innerText = this.translation.size2
  

    this.elements.originalMeanDiff.innerText = this.translation.diffOfMean
    this.charts.originalDataGroup1Chart.clear()
    this.charts.originalDataGroup2Chart.clear()
    this.charts.originalDataGroup2Chart.chart.update()
    this.charts.originalDataGroup1Chart.chart.update()
  }
  clearSimulationDataSection(){
    this.elements.numSimulations.value = 1
    this.charts.sampleChart1.clear()
    this.charts.sampleChart2.clear()
    this.resetSimulationStats()
    this.sampleDifferences = []
    this.charts.sampleChart1.chart.update()
    this.charts.sampleChart2.chart.update()

  }
  resetSimulationStats(){
    this.elements.sampleMean1.innerText = this.translation.randomMean1
    this.elements.sampleMean2.innerText = this.translation.randomMean2
    this.elements.sampleSD1.innerText = this.translation.randomSD1
    this.elements.sampleSD2.innerText = this.translation.randomSD2
    this.elements.sampleMeanDiff.innerText = this.translation.diffOfSampleMean
  }
  clearLastSection(){
   this.resetLastSecStats()
   this.resetLastChart()
  }
  resetLastSecStats(){
    this.elements.lastDiff.innerText = ""
    this.elements.lastMean.innerText = ""
    this.elements.lastSD.innerText= ""
    this.elements.totalSamples.innerText = ""
    this.elements.ci.value = "95"
    this.elements.ciDisplay.innerText = "95"
    this.elements.lower.innerText  = ""
    this.elements.upper.innerText = ""
    
  }
  resetLastChart(){
    this.charts.diffChart.clear()
    this.charts.diffChart.chart.update()
  }
  updateOriginalDataSection(){
    const {group1Data: group1, group2Data: group2} = this.dataManipulationEngine.extract(["group1Data", "group2Data"])
    const min = this.parsedData.Value.reduce((a, b) =>{
      return Math.min(a, b)
    })
    const max = this.parsedData.Value.reduce((a, b) => {
      return Math.max(a, b)
    })
    this.charts.originalDataGroup1Chart.setScale(min, max)
    this.charts.originalDataGroup2Chart.setScale(min, max)
    this.charts.originalDataGroup1Chart.setDataFromRaw([group1])
    this.charts.originalDataGroup2Chart.setDataFromRaw([group2])
    this.charts.originalDataGroup1Chart.scaleToStackDots()
    this.charts.originalDataGroup2Chart.scaleToStackDots()
    this.charts.originalDataGroup1Chart.chart.update(0)
    this.charts.originalDataGroup2Chart.chart.update(0)
    this.elements.size2.innerText = this.translation.size2 + " " + this.group2Size
    this.elements.size1.innerText = this.translation.size1 + " " + this.group1Size
    const group1Stats = this.updateSummary({
      group1Mean: {
        property: 'innerText',
        compute: 'mean',
      },
      group1SD: {
        property: 'innerText',
        compute: 'sd'
      }
    }, group1)
    const group2Stats = this.updateSummary({
      group2Mean:{
        property: 'innerText',
        compute: 'mean'
      },
      group2SD: {
        property: 'innerText',
        compute: 'sd'
      }
    }, group2)
    const diff = this.updateSummary({
      originalMeanDiff: {
        property: 'innerText',
        compute: 'custom'
      }
    }, group1Stats.mean - group2Stats.mean)
    this.originalDiff = group1Stats.mean - group2Stats.mean
    

  }
  updateSummary(configurations, data){
    const getStatistic = (update, roundTo) => {
      let computation = 0
      switch(update.toLowerCase()){
        case 'mean':
          computation = MathUtil.mean(data)
          break
        case 'standarddeviation':
        case 'sd':
          computation = MathUtil.stddev(data)
          break
        case 'custom':
          computation = data
          break
        case 'length':
          computation = data.length
          break
        default:
          computation = 0
          break
      }
      if (roundTo > -1) {
        computation = MathUtil.roundToPlaces(computation, roundTo)

      }
      return computation
    }
    const computations = {}
    Object.keys(configurations).forEach((key) => {

      const settings = configurations[key]
      const statistic = getStatistic(settings.compute, settings.hasOwnProperty('roundTo') ? settings.roundTo: 4)
      if(settings.hasOwnProperty('property')){
        this.elements[key][settings.property] += '   ' + statistic
      }
      computations[settings.compute] = statistic
    })
    return computations
    
  }
  seperateDataByColumn(data, separate, by){
    const blocks = {}
    data[separate].forEach((dataobj, index) => {
      const delimiter = data[by][index]
      if(!blocks.hasOwnProperty(delimiter)){
        blocks[delimiter] = [dataobj]
      }else{
        blocks[delimiter].push(dataobj)
      }
    })
    return blocks
  }
  increase(group, factor){
    if (factor === 0){
      alert(this.translation.incrementZeroWarning)
      return 
    }
    const groupNum = group
    group = `group${group}`
    const data = `${group}Data`
    const real = `originalData${groupNum}`
    if(this.dataManipulationEngine.isEmpty(data)){
      return 
    }
    this.dataManipulationEngine.register(data, this.dataManipulationEngine.replicate(real, factor, false, true))
    this.dataManipulationEngine.register(group, this.dataManipulationEngine.replicate(group, this.dataManipulationEngine.get(data).length, true))
    this.clearSimulationDataSection()
    this.clearLastSection()



  }
  runSimulations(){
     const numSimulations = Number(this.elements.numSimulations.value) || 1
     for(let i  = 0; i < numSimulations; i++){
       const {chosen:chosenGroup1} = randomSubset(this.dataManipulationEngine.get('group1Data'), this.group1Size)
       const {chosen:chosenGroup2} = randomSubset(this.dataManipulationEngine.get('group2Data'), this.group2Size)
        
        const group1Stats = this.updateSummary({
          mean: {
            compute: 'mean'
          },
          sd: {
            compute: 'sd'
          }
        }, chosenGroup1)
        const group2Stats =this.updateSummary({
          mean: {
            compute: 'mean'
          },
          sd: {
            compute: 'sd'
          }
        }, chosenGroup2)
        const meanDiff = this.updateSummary({
          mean: {
            compute: 'custom'
          }
        }, group1Stats.mean - group2Stats.mean)
        this.sampleDifferences.push(meanDiff.custom)
        if(i == numSimulations - 1){
          this.updateSimulationSection(chosenGroup1, chosenGroup2)

        }
        
     }
  }
  
  updateSimulationSection(group1Chosen, group2Chosen){

    const pr = 5
    this.charts.sampleChart1.changeDotAppearance(pr, undefined)
    this.charts.sampleChart2.changeDotAppearance(pr, undefined);
    this.charts.sampleChart1.setDataFromRaw([group1Chosen])
    this.charts.sampleChart2.setDataFromRaw([group2Chosen])
    this.charts.sampleChart1.chart.update();
    this.charts.sampleChart2.chart.update();
    const property= 'innerText'
    this.resetSimulationStats()
    const group1Stats = this.updateSummary({
      sampleMean1: {
        property,
        compute: 'mean'
      },
      sampleSD1: {
        property,
        compute: 'sd'
      }
    }, group1Chosen)
    const group2Stats =this.updateSummary({
      sampleMean2: {
        property,
        compute: 'mean'
      },
      sampleSD2: {
        property,
        compute: 'sd'
      }
    }, group2Chosen)
    const meanDiff = this.updateSummary({
      sampleMeanDiff: {
        property,
        compute: 'custom'
      }
    }, group1Stats.mean - group2Stats.mean)
    this.updateLastSec()


    
  }
  updateLastSecSummary(){
    const property = "innerText"
    this.resetLastSecStats()
    this.updateSummary({
      lastDiff: {
        property,
        compute: 'custom' 
      }
    }, this.originalDiff)
    const stats = this.updateSummary({
      lastMean: {
        property,
        compute : 'mean'
      },
      lastSD: {
        property,
        compute: 'sd'
      }, 
      totalSamples: {
        property,
        compute: 'length'
      }
    }, this.sampleDifferences)
    return stats
  }
  updateLastSecCharts(){
    const confidenceLevel = Number(this.elements.ci.value) || 0
    if (confidenceLevel == 0) return  

    const [lower, upper] = MathUtil.getCutOffInterval(confidenceLevel, this.sampleDifferences.length)
    const temp = this.sampleDifferences.map(val => val)
    temp.sort((a, b) => a - b)
    const [chosen, unchosen] = splitUsing(temp, (val, index) => {
      return val >= temp[lower] &&  val <= temp[upper >= temp.length ? upper - 1: upper]
    })
    this.elements.lower.innerText = temp[lower]
    this.elements.upper.innerText = temp[upper >= temp.length? upper - 1: upper]

    this.charts.diffChart.changeDotAppearance(4, undefined)
    const shift = this.sampleDifferences.length < 500 ? 0: 3
    this.charts.diffChart.setScale(temp[0] - shift, temp[temp.length-1] + shift)
    this.charts.diffChart.setDataFromRaw([chosen, unchosen])
    this.charts.diffChart.scaleToStackDots()

    this.charts.diffChart.chart.update()


  }
  updateLastSec(){
    this.updateLastSecSummary()
    this.updateLastSecCharts()
  }


}
