import { Repository } from '../repository'
import Model from './model'
import { ModelDescriptor } from './model-descriptor'

/**
 * Is a map of all registered models in the application. 
 * It's a singleton.
 */
const models = new Map<string, ModelDescriptor<any>>()
export default models



export function clearModels() {
    for(let [modelName, modelDescriptor] of models) {
        modelDescriptor.idFieldDescriptors.disposers.forEach(disposer => disposer())
        for(let fieldName in modelDescriptor.fields) {
            modelDescriptor.fields[fieldName].disposers.forEach(disposer => disposer())
        }
        for(let fieldName in modelDescriptor.relations) {
            modelDescriptor.relations[fieldName].disposers.forEach(disposer => disposer())
        }
    }
    models.clear()
}

