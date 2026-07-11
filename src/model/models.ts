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
        // Descriptor-level disposers (e.g. the cache-store observers registered
        // by `one`/`many` relations). The id decorator does not register any
        // descriptor-level disposers — its interceptors live on each instance's
        // `obj.disposers` and are released by `obj.destroy()` below.
        for(let fieldName in modelDescriptor.fields) {
            modelDescriptor.fields[fieldName].disposers.forEach(disposer => disposer())
        }
        for(let fieldName in modelDescriptor.relations) {
            modelDescriptor.relations[fieldName].disposers.forEach(disposer => disposer())
        }
        // Clear the cache: destroys every cached object (releasing its own
        // disposers) and drops the references so objects don't leak.
        modelDescriptor.cache.clear()
    }
    models.clear()
}

