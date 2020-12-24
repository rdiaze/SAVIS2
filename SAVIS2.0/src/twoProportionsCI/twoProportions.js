---
---

import {countWhere, roundToPlaces, mean, stddev, getCutOffInterval} from "{{base}}../util/math.js";
import {randomInt, shuffle, splitUsing} from "{{base}}../util/sampling.js";
import StackedDotChart from "../util/stackeddotchart.js";
import * as Summaries from "{{base}}../util/summaries.js";
import TwoPropChart from "{{base}}./twoPropChart.js";
import translation from "{{base}}../util/translate.js";
import { randomSubset } from "../util/sampling.js";

export class TwoProportions {

  constructor(twoPropDiv) {
    this.dom = {
      twoPropDiv,
      aSuccess: twoPropDiv.querySelector('#a-success'),
      aFailure: twoPropDiv.querySelector('#a-failure'),
      bSuccess: twoPropDiv.querySelector('#b-success'),
      bFailure: twoPropDiv.querySelector('#b-failure'),
      inputCanvas: twoPropDiv.querySelector("#input-bars"),
      lastSimCanvas: twoPropDiv.querySelector("#last-sim-bars"),
      numSimulations: twoPropDiv.querySelector('#num-simulations'),
      needData: twoPropDiv.querySelectorAll('[disabled=need-data]'),
      needResults: twoPropDiv.querySelectorAll('[disabled=need-results]'),
      chartEle: twoPropDiv.querySelector("#ci-chart"),
      ciElement: twoPropDiv.querySelector("#confidence-level"),
      ciDisplay: twoPropDiv.querySelector("#confidence-level-display"),
      buildCi: twoPropDiv.querySelector("#buildci"),
      increment: twoPropDiv.querySelector("#increment"),
      incButton: twoPropDiv.querySelector("#incrementButton")
      
    };
    this.translation = translation.twoProportions
    this.noData = this.translation.noData
    this.summaryElements = Summaries.loadSummaryElements(twoPropDiv);
    this.simulations = []
    this.dataElements = [
      {label: this.translation.InInterval, backgroundColor: 'green', data: []},
      {label: this.translation.NotInInterval, backgroundColor: 'red', data: []}
    ]
    this.charts = {
      inputChart: new TwoPropChart(this.dom.inputCanvas),
      lastSimChart: new TwoPropChart(this.dom.lastSimCanvas),
      ciChart: new StackedDotChart(this.dom.chartEle, this.dataElements)

   
    };
    this.charts.ciChart.setAnimationDuration(0)
    this.dom.ciElement.addEventListener("input", event => {
      this.dom.ciDisplay.innerText = this.dom.ciElement.value
      event.preventDefault()
    })
    this.dom.buildCi.addEventListener('click', event => {
      if(!this.validateIncrement()){
        alert(this.translation.incrementWarning)
        return 
      }
      this.updateLastChart()

      event.preventDefault()
    })
    this.dom.incButton.addEventListener('click', this.incrementCallBack());
   

  }
  incrementCallBack(){
    const increment = (event) => {
      const factor = Number(this.dom.increment.value) || 0
      if(this.data && this.numAFailure > 0 && this.numASuccess > 0 && this.numBSuccess > 0 && this.numBFailure > 0 && factor > 0){
        this.data.numAFailure = this.numAFailure * factor
        this.data.numBFailure = this.numBFailure * factor 
        this.data.numASuccess = this.numASuccess * factor
        this.data.numBSuccess = this.numBSuccess * factor
        const summary = {
          ...this.data,
          ...this.resetAllBut(["numASuccess", "numAFailure", "numBSuccess", "numBFailure", "proportionA", "proportionB", "proportionDiff"]) 
        }
        Summaries.updateSummaryElements(this.summaryElements, summary)
        this.charts.inputChart.setProportions(this.data)
        this.charts.inputChart.update();
        this.charts.lastSimChart.setProportions({
          numAFailure: 0, numASuccess: 0, numBFailure:0, numBSuccess:0
        })
        this.charts.lastSimChart.update()
        this.resetLastChart()


      }else{
          if (this.numAFailure == 0 || this.numASuccess == 0 || this.numBSuccess == 0 || this.numBFailure == 0){
            if (factor == 0){
              alert(this.translation.incrementZeroWarning)

            }
          }else{
            if(factor == 0)
              alert(this.translation.incrementZeroWarning)

          }
      }

      event.preventDefault()
    }
    return increment
  }
  validateIncrement(){
    if(this.data){
      if (this.data.numAFailure == this.numAFailure && this.data.numBFailure == this.numBFailure && this.data.numASuccess == this.numASuccess && this.data.numBSuccess == this.numBSuccess){
        return false
      }
      
    }
    return true
  }

  loadData() {
    let numASuccess = this.dom.aSuccess.value * 1;
    let numAFailure = this.dom.aFailure.value * 1;
    let numBSuccess = this.dom.bSuccess.value * 1;
    let numBFailure = this.dom.bFailure.value * 1;
    if (numASuccess <= 0 || numAFailure <= 0 || numBSuccess <= 0 || numBFailure <= 0) {
      alert(translation.twoProportions.alertAtLeastOne);
    }
    else {
      this.resetLastChart()
      let summary = {
        numASuccess, numAFailure, numBSuccess, numBFailure,
        proportionA: numASuccess / (numASuccess + numAFailure), // todo(matthewmerrill): fixed decimals
        proportionB: numBSuccess / (numBSuccess + numBFailure),
        ...this.resetAllBut(["numASuccess", "numAFailure", "numBSuccess", "numBFailure", "proportionA", "proportionB"])
        
      }
      
      summary.proportionDiff = summary.proportionA - summary.proportionB;
      Summaries.updateSummaryElements(this.summaryElements, summary);
      this.data = { numASuccess, numAFailure, numBSuccess, numBFailure };
      this.numASuccess = numASuccess
      this.numAFailure = numAFailure
      this.numBFailure = numBFailure
      this.numBSuccess = numBSuccess
      this.charts.inputChart.setProportions(this.data);
      this.charts.inputChart.update();
      this.charts.lastSimChart.setProportions({
        numASuccess: 0, numAFailure: 0, numBSuccess: 0, numBFailure: 0,
      });
      this.charts.lastSimChart.update();
      for (let elem of this.dom.needData) {
        elem.removeAttribute('disabled');
      }
      for (let elem of this.dom.needResults) {
        elem.setAttribute('disabled', true);  
      }
    }
  }

  resetAllBut(remove) {
    const keys = Object.keys(this.summaryElements)
    const result = {}
    keys.forEach(key => {
      if (!remove.includes(key)){
        result[key] = this.noData
      }
    })
    return result
  }
  samplePot(total, success,  sampleSize){
    const items = new Array(total)
    items.fill(0)
    items.fill(1, 0, success)
    const shuffled = shuffle(items)
    const {chosen} = randomSubset(shuffled, sampleSize)
    const successes = countWhere(chosen, data => data == 1)
    const failures = sampleSize - successes
    return {
      successes,
      failures,
      sampleSize,
      prop: successes / (sampleSize + 0.0)
    }
  }
  runSimulations() {
    if(!this.validateIncrement()){
      alert(this.translation.incrementWarning)
      return 
    }
    let numSimulations = this.dom.numSimulations.value * 1;
    let {numASuccess, numAFailure, numBSuccess, numBFailure} = this.data;
    let totalGroupA = numASuccess + numAFailure;
    let totalGroupB = numBSuccess + numBFailure;
    for (let simIdx = 0; simIdx < numSimulations; simIdx++) {
      
      const {successes: sampleASuccess, failures: sampleAFailure, sampleSize: totalA, prop: sampleAProportion} = this.samplePot(totalGroupA, numASuccess, this.numAFailure + this.numASuccess)
      const {successes: sampleBSuccess, failures: sampleBFailure, sampleSize: totalB, prop: sampleBProportion} = this.samplePot(totalGroupB, numBSuccess, this.numBFailure + this.numBSuccess)
      this.simulations.push(sampleAProportion - sampleBProportion)
      if (simIdx + 1 === numSimulations) {
        this.charts.lastSimChart.setProportions({
          numASuccess: sampleASuccess,
          numBSuccess: sampleBSuccess,
          numAFailure: sampleAFailure,
          numBFailure: sampleBFailure,
        });

        let summary = {
          sampleASuccess, sampleAFailure, sampleBSuccess, sampleBFailure,
          sampleProportionA: sampleAProportion,
          sampleProportionB: sampleBProportion,
          sampleProportionDiff: sampleAProportion - sampleBProportion,
          mean: mean(this.simulations),
          stddev: stddev(this.simulations),
          total: this.simulations.length

        };
        Summaries.updateSummaryElements(this.summaryElements, summary);
        this.updateLastChart()
      }
    }
    this.charts.lastSimChart.update();
 
  }

  updateLastChart(){
    const confidenceLevel = Number(this.dom.ciElement.value) || 0
    if (confidenceLevel == 0) return  

    const [lower, upper] = getCutOffInterval(confidenceLevel, this.simulations.length)
    const temp = this.simulations.map(val => val)
    temp.sort((a, b) => a - b)
    const [chosen, unchosen] = splitUsing(temp, (val, index) => {
      return val >= temp[lower] &&  val <= temp[upper >= temp.length ? upper - 1: upper]
    })
   
    const summary ={
      lower: temp[lower], upper: temp[upper >= temp.length ? upper - 1: upper]
    }
    Summaries.updateSummaryElements(this.summaryElements, summary)
    const shift = temp.length < 500 ? 0:0
    this.charts.ciChart.setScale(temp[0]-shift, temp[temp.length - 1]+shift)
    this.charts.ciChart.setDataFromRaw([chosen, unchosen])
    this.charts.ciChart.scaleToStackDots()
    this.charts.ciChart.chart.update()
  }

  resetLastChart(){
    this.charts.ciChart.clear()
    this.charts.ciChart.chart.update()
    this.dom.ciDisplay.innerText = "95"
    this.dom.ciElement.value = "95"
    this.simulations = []
  }

}
