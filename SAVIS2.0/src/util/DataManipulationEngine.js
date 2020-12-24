
export default class DataManipulationEngine {
    constructor(){
        this.datasets = {}
    }
    /**
     * Copy the dataset identified by the given identifier
     * @param {*} identifier 
     */
    copy(identifier){
        return this.datasets[identifier].map(val => val)
    }
    /**
     * Register/Update the dataset identified by the given identifier
     * @param {*} identifier 
     * @param {*} dataset 
     */
    register(identifier, dataset){
        this.datasets[identifier] = dataset
    }
    /**
     * Retrieves the copy or the original dataset identifier by the given identifier
     * @param {*} identifier 
     * @param {*} copy
     */
    get(identifier, copy = false){
        return copy ? this.copy(identifier): this.datasets[identifier]
    }
    /**
     * Replicates the whole or each unique element in copy or the original dataset by the given "by" factor
     * @param {*} identifier 
     * @param {*} by 
     * @param {*} each 
     * @param {*} copy 
     */
    replicate(identifier, by, each, copy = false){
        const data = this.get(identifier, copy)
        let replicatedData = []
        if(!each){
            for(let i = 0; i < by; i++){
                replicatedData = replicatedData.concat(data)
            }
        }else{
            const elements = new Set(data)
            for(let element of elements){
                for(let i = 0; i < by; i++){
                    replicatedData.push(element)
                }
            }

        }
        return replicatedData

    }
    /**
     * Extract multiple original datasets or copy of them and optionally transform them using given tranformation logic
     * @param {} identifiers 
     * @param {*} transform 
     * @param {} copy
     */
    extract(identifiers, transform = null, copy = false){
        if(!Array.isArray(identifiers)){
            identifiers = [identifiers]
        }
        const datasets = {}
        identifiers.forEach(identifier => {
            datasets[identifier] = this.get(identifier, copy)
        })
        if(transform && typeof transform === "function"){
            return transform(datasets)
        }
        return datasets

    }
    /**
     * Checks if the identified dataset is empty or not
     * @param {*} identifier 
     */
    isEmpty(identifier = null){
        if(identifier == null) return Object.keys(this.datasets).length === 0 
        if(!this.datasets.hasOwnProperty(identifier) || !this.datasets[identifier]){
            return true
        }
        return false
    }
    /**
     * Combine multiple datasets identified by identifiers into one dataset
     * @param {*} identifiers 
     */
    combine(identifiers, transform =  null, copy = false){
    
        const datasets = this.extract(identifiers, (datasets) => Object.values(datasets), copy)
        let combined = []
        datasets.forEach((dataset,index) => {
            let temp = dataset
            if(transform && typeof transform == "function"){
                temp = transform(dataset, index)
            }
            combined = combined.concat(temp)

        })
        return combined

    }
    /**
     * Access the property from identified or all datasets if property exists
     * @param {*} property 
     * @param {*} identifiers 
     */
    property(property, identifiers = []){
        const datasets = identifiers.length ? this.extract(identifiers,  null, false): this.datasets
        const result = {}
        Object.keys(datasets).forEach(key => {
            if (this.datasets[key].hasOwnProperty(property)){
                result[key] = this.datasets[key][property]
            }
        })
      
        return result
    }
    /**
     * Thrash the datasets
     */
    thrash(){
        this.datasets = {}
    }

};